import {scribe} from "../../typedefs/core";

import {
    CollectionDefinition,
    HeaderDefinition,
    ItemDefinition,
    QueryParamDefinition, RequestAuthDefinition,
    RequestBodyDefinition,
    Url,
    UrlDefinition
} from "postman-collection";
import {URL} from "url";
import uuid = require('uuid');
import striptags = require('striptags');

const VERSION = '2.1.0';
export = (config: scribe.Config) => {
    const parsedUrl = new URL(config.baseUrl);

    function makePostmanCollection(groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }) {
        const collection: CollectionDefinition & { info: { description: string, schema: string, _postman_id: string } } = {
            variable: [
                {
                    id: 'baseUrl',
                    key: 'baseUrl',
                    type: 'string',
                    name: 'string',
                    value: parsedUrl.host,
                }
            ],
            info: {
                name: config.title,
                description: config.description || '',
                schema: `https://schema.getpostman.com/json/collection/v${VERSION}/collection.json`,
                _postman_id: uuid.v4(),
            },
            item: Object.entries(groupedEndpoints).map(([groupName, endpoints]) => {
                return {
                    name: groupName,
                    description: endpoints.find(e => e.metadata.groupDescription != null)
                        ?.metadata.groupDescription ?? '',
                    item: endpoints.map(generateEndpointItem),
                };
            }),
            auth: generateAuthObject(),
        };

        return collection;
    }

    function generateAuthObject(): RequestAuthDefinition {
        if (!config.auth.enabled) {
            return {
                type: 'noauth'
            };
        }

        switch (config.auth.in) {
            case "basic":
                return {
                    type: 'basic',
                };
            case "bearer":
                return {
                    type: 'bearer',
                };
            default:
                return {
                    type: 'apikey',
                    apikey: [
                        {
                            key: 'in',
                            value: config.auth.in,
                            type: 'string',
                        },
                        {
                            key: 'key',
                            value: config.auth.name,
                            type: 'string',
                        }
                    ],
                };
        }
    }

    function generateEndpointItem(endpoint: scribe.Endpoint): ItemDefinition {
        return {
            name: endpoint.metadata.title !== '' ? endpoint.metadata.title : endpoint.uri,
            request: {
                url: generateUrlObject(endpoint) as Url, // not really, but the typedef is wrong
                method: endpoint.methods[0],
                header: resolveHeadersForEndpoint(endpoint),
                body: (Object.entries(endpoint.bodyParameters).length === 0) ? null : getBodyData(endpoint),
                description: endpoint.metadata.description || null,
                auth: endpoint.metadata.authenticated ? undefined : {type: 'noauth'}
            },
            response: [],
        };
    }

    function generateUrlObject(endpoint: scribe.Endpoint): UrlDefinition {
        // URL Parameters are collected by the `UrlParameters` strategies, but only make sense if they're in the route
        // definition. Filter out any URL parameters that don't appear in the URL.
        const urlParams = Object.entries(endpoint.urlParameters).filter(([key, data]) => endpoint.uri.includes(`:${key}`));

        const base: UrlDefinition & { raw?: string } = {
            protocol: parsedUrl.protocol.replace(/:$/, ''),
            host: "{{baseUrl}}",
            path: endpoint.uri.replace(/^\//, ''),
            query: Object.entries(endpoint.queryParameters).map(function ([key, parameterData]) {
                return {
                    key: key,
                    value: encodeURIComponent(parameterData.value),
                    description: striptags(parameterData.description),
                    // Default query params to disabled if they aren't required and have empty values
                    disabled: (parameterData.required == false) && parameterData.value == null,
                };
            })
        };

        // Create raw url-parameter (Insomnia uses this on import)
        const query = (base.query as QueryParamDefinition[])
            .map((queryParamData) => `${queryParamData.key}=${queryParamData.value}`)
            .join('&');
        base.raw = `${base.protocol}://${base.host}/${base.path}${query ? '?' + query : ''}`;

        // If there aren't any url parameters described then return what we've got
        if (!urlParams.length) {
            return base;
        }

        base.variable = urlParams.map(([name, parameter]) => {
            return {
                id: name,
                key: name,
                value: encodeURIComponent(parameter.value),
                description: parameter.description,
            };
        });

        return base;
    }

    function getBodyData(endpoint) {
        const body = {} as RequestBodyDefinition;
        const contentType = endpoint.headers['Content-Type'] ?? null;
        let inputMode;

        switch (contentType) {
            case 'multipart/form-data':
                inputMode = 'formdata';
                break;
            case 'application/json':
            default:
                inputMode = 'raw';
        }
        body.mode = inputMode as 'formdata' | 'raw';
        body[inputMode] = [];

        switch (inputMode) {
            case 'formdata':
                for (let [key, value] of Object.entries(endpoint.cleanBodyParameters)) {
                    // @ts-ignore
                    body[inputMode].push({
                        key: key,
                        value: value,
                        type: 'text'
                    });
                }

                for (let [key, value] of Object.entries(endpoint['fileParameters'])) {
                    // @ts-ignore
                    body[inputMode].push({
                        key: key,
                        src: [],
                        type: 'file'
                    });
                }
                break;
            case 'raw':
            default:
                body[inputMode] = JSON.stringify(endpoint['cleanBodyParameters'], null, 4);
        }
        return body;
    }

    function resolveHeadersForEndpoint(endpoint: scribe.Endpoint): HeaderDefinition[] {
        const headers = endpoint.headers;

        return Object.entries(Object.assign({Accept: 'application/json'}, headers))
            .map(([header, value]) => {
                // Allow users to write {header: '@{{value}}'} in config
                // and have it rendered properly as {{value}} in the Postman collection.
                value = value.replace('@{{', '{{');
                return {
                    key: header,
                    value: value,
                };
            });
    }

    return {
        VERSION,
        makePostmanCollection,
    };

}