"use strict";
const URL = require("url").URL;
const uuid = require("uuid");
const striptags = require("striptags");
const POSTMAN_SCHEMA_VERSION = '2.1.0';
module.exports = (config) => {
    const parsedUrl = new URL(config.baseUrl);
    function makePostmanCollection(groupedEndpoints) {
        const collection = {
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
                schema: `https://schema.getpostman.com/json/collection/v${POSTMAN_SCHEMA_VERSION}/collection.json`,
                _postman_id: uuid.v4(),
            },
            item: groupedEndpoints.map(group => {
                return {
                    name: group.name,
                    description: group.description,
                    item: group.endpoints.map(generateEndpointItem),
                };
            }),
            auth: generateAuthObject(),
        };
        return collection;
    }
    function generateAuthObject() {
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
    function generateEndpointItem(endpoint) {
        return {
            name: endpoint.metadata.title !== '' ? endpoint.metadata.title : endpoint.uri,
            request: {
                url: generateUrlObject(endpoint),
                method: endpoint.httpMethods[0],
                header: resolveHeadersForEndpoint(endpoint),
                body: (Object.entries(endpoint.bodyParameters).length === 0) ? null : getBodyData(endpoint),
                description: endpoint.metadata.description || null,
                auth: endpoint.metadata.authenticated ? undefined : { type: 'noauth' }
            },
            // @ts-ignore
            response: getResponses(endpoint),
        };
    }
    function generateUrlObject(endpoint) {
        // URL Parameters are collected by the `UrlParameters` strategies, but only make sense if they're in the route
        // definition. Filter out any URL parameters that don't appear in the URL.
        const urlParams = Object.entries(endpoint.urlParameters).filter(([key, data]) => endpoint.uri.includes(`:${key}`));
        const base = {
            protocol: parsedUrl.protocol.replace(/:$/, ''),
            host: "{{baseUrl}}",
            path: endpoint.uri.replace(/^\//, ''),
        };
        const queryParameters = Object.assign({}, endpoint.queryParameters);
        const [where, authParam] = getAuthParamToExclude();
        if (where === 'query') {
            delete queryParameters[authParam];
        }
        const query = [];
        Object.entries(queryParameters).forEach(([name, parameterData]) => {
            if (parameterData.type.endsWith('[]')) {
                // Node.js's querystring module parses array query parameters as filters=name&filters=age
                // See https://nodejs.org/api/querystring.html#querystring_querystring_parse_str_sep_eq_options
                const examples = parameterData.example || [];
                examples.forEach((value) => {
                    query.push({
                        key: encodeURIComponent(name),
                        value: encodeURIComponent(value),
                        description: striptags(parameterData.description),
                        // Default query params to disabled if they aren't required and have empty values
                        disabled: (parameterData.required == false) && parameterData.example == null,
                    });
                });
            }
            else if (parameterData.type === 'object') {
                // No guarantee this will actually be parsed by the API
                const examples = parameterData.example || {};
                Object.entries(examples).forEach(([key, value]) => {
                    query.push({
                        key: encodeURIComponent(`${key}[${name}]`),
                        value: encodeURIComponent(value),
                        description: striptags(parameterData.description),
                        // Default query params to disabled if they aren't required and have empty values
                        disabled: (parameterData.required == false) && parameterData.example == null,
                    });
                });
            }
            else {
                query.push({
                    key: name,
                    value: encodeURIComponent(parameterData.example),
                    description: striptags(parameterData.description),
                    // Default query params to disabled if they aren't required and have empty values
                    disabled: (parameterData.required == false) && parameterData.example == null,
                });
            }
        });
        base.query = query;
        // Create raw url-parameter (Insomnia uses this on import)
        const queryString = query
            .map((queryParamData) => `${queryParamData.key}=${queryParamData.value}`)
            .join('&');
        base.raw = `${base.protocol}://${base.host}/${base.path}${queryString ? '?' + queryString : ''}`;
        // If there aren't any url parameters described then return what we've got
        if (!urlParams.length) {
            return base;
        }
        base.variable = urlParams.map(([name, parameter]) => {
            return {
                id: name,
                key: name,
                value: encodeURIComponent(parameter.example),
                description: parameter.description,
            };
        });
        return base;
    }
    function getBodyData(endpoint) {
        var _a;
        const body = {};
        const contentType = (_a = endpoint.headers['Content-Type']) !== null && _a !== void 0 ? _a : null;
        let inputMode;
        switch (contentType) {
            case 'multipart/form-data':
                inputMode = 'formdata';
                break;
            case 'application/json':
            default:
                inputMode = 'raw';
        }
        body.mode = inputMode;
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
                for (let [key, value] of Object.entries(endpoint.fileParameters)) {
                    while (Array.isArray(value)) { // For arrays of files, just send the first one
                        key += '[]';
                        value = value[0];
                    }
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
                body[inputMode] = JSON.stringify(endpoint.cleanBodyParameters, null, 4);
        }
        return body;
    }
    function resolveHeadersForEndpoint(endpoint) {
        const headers = Object.assign({}, endpoint.headers);
        const [where, authParam] = getAuthParamToExclude();
        if (where === 'header') {
            delete headers[authParam];
        }
        return Object.entries(Object.assign({ Accept: 'application/json' }, headers))
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
    function getAuthParamToExclude() {
        if (!config.auth.enabled) {
            return [null, null];
        }
        if (['bearer', 'basic'].includes(config.auth.in)) {
            return ['header', 'Authorization'];
        }
        else {
            return [config.auth.in, config.auth.name];
        }
    }
    function getResponses(endpoint) {
        return endpoint.responses.map((response) => {
            const headers = [];
            for (let header in response.headers) {
                headers.push({
                    key: header,
                    value: response.headers[header],
                });
            }
            return {
                header: headers,
                code: response.status,
                body: response.content,
                name: response.description,
            };
        });
    }
    return {
        VERSION: POSTMAN_SCHEMA_VERSION,
        makePostmanCollection,
    };
};
//# sourceMappingURL=postman.js.map