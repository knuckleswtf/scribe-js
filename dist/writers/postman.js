"use strict";
const uuid = require("uuid");
const striptags = require("striptags");
const url_1 = require("url");
module.exports = (config) => {
    const baseUrl = config.baseUrl;
    const parsedUrl = new url_1.URL(baseUrl);
    function makePostmanCollection(groupedEndpoints) {
        const collection = {
            variable: [],
            info: {
                name: config.title,
                description: config.description || '',
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
                _postman_id: uuid.v4(),
            },
            item: Object.entries(groupedEndpoints).map(([groupName, endpoints]) => {
                var _a, _b;
                return {
                    name: groupName,
                    description: (_b = (_a = endpoints.find(e => Boolean(e.metadata.groupDescription))) === null || _a === void 0 ? void 0 : _a.metadata.groupDescription) !== null && _b !== void 0 ? _b : '',
                    item: endpoints.map(generateEndpointItem),
                };
            })
        };
        return collection;
    }
    function generateEndpointItem(endpoint) {
        const method = endpoint.methods[0];
        return {
            name: endpoint.metadata.title !== '' ? endpoint.metadata.title : endpoint.uri,
            request: {
                url: generatePostmanUrlObject(endpoint),
                method: method,
                header: resolveHeadersForEndpoint(endpoint),
                body: getBodyData(endpoint),
                description: endpoint.metadata.description || null,
            },
            response: [],
        };
    }
    function generatePostmanUrlObject(endpoint) {
        // URL Parameters are collected by the `UrlParameters` strategies, but only make sense if they're in the route
        // definition. Filter out any URL parameters that don't appear in the URL.
        const urlParams = Object.entries(endpoint.urlParameters).filter(([key, data]) => endpoint.uri.includes(`:${key}`));
        const base = {
            protocol: parsedUrl.protocol.replace(/:$/, ''),
            host: parsedUrl.host,
            path: endpoint.uri.replace(/^\//, ''),
            query: Object.entries(endpoint.queryParameters).map(function ([key, parameterData]) {
                // Replace object syntax}
                key = key.replace(/\.\*$/, '');
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
        const query = base.query
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
                for (let [key, value] of Object.entries(endpoint['fileParameters'])) {
                    // @ts-ignore
                    body[inputMode].push({
                        key: key,
                        src: [],
                        value: value,
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
    function resolveHeadersForEndpoint(endpoint) {
        const headers = endpoint.headers;
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
    return {
        makePostmanCollection,
    };
};
//# sourceMappingURL=postman.js.map