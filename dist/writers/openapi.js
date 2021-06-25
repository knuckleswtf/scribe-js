"use strict";
const p = require("../utils/parameters");
const collect = require('collect.js');
const OPENAPI_SCHEMA_VERSION = '3.0.3';
const EMPTY = {};
function generateSecurityPartialSpec(config) {
    const isApiAuthed = config.auth.enabled;
    if (!isApiAuthed) {
        return {};
    }
    const location = config.auth.in;
    const parameterName = config.auth.name;
    let scheme = {};
    switch (location) {
        case 'query':
        case 'header':
            scheme = {
                type: 'apiKey',
                name: parameterName,
                in: location,
                description: '',
            };
            break;
        case 'bearer':
        case 'basic':
            scheme = {
                type: 'http',
                scheme: location,
                description: '',
            };
            break;
        // OpenAPI doesn't support auth with body parameter
    }
    return {
        // All security schemes must be registered in `components.securitySchemes`...
        components: {
            securitySchemes: {
                // 'default' is an arbitrary name for the auth scheme. Can be anything, really.
                'default': scheme,
            },
        },
        // ...and then can be applied in `security`
        security: [
            {
                'default': [],
            },
        ],
    };
}
function generateEndpointParametersSpec(endpoint) {
    const parameters = [];
    if (endpoint.queryParameters) {
        Object.entries(endpoint.queryParameters).forEach(([name, details]) => {
            const parameterData = {
                in: 'query',
                name: name,
                description: details.description || '',
                example: details.example || null,
                required: details.required || false,
                schema: generateFieldData(details),
            };
            parameters.push(parameterData);
        });
    }
    if (endpoint.headers) {
        Object.entries(endpoint.headers).forEach(([name, value]) => {
            parameters.push({
                in: 'header',
                name: name,
                description: '',
                example: value,
                schema: {
                    type: 'string',
                },
            });
        });
    }
    return parameters;
}
function getResponseDescription(response) {
    if (typeof response.content == 'string' && response.content.startsWith("<<binary>>")) {
        return response.content.replace("<<binary>>", "").trim();
    }
    return String(response.description || '');
}
function generateResponseContentSpec(responseContent, endpoint) {
    if (typeof responseContent == 'string' && responseContent.startsWith("<<binary>>")) {
        return {
            'application/octet-stream': {
                schema: {
                    type: 'string',
                    format: 'binary',
                }
            }
        };
    }
    if (responseContent === null) {
        return {
            'application/json': {
                schema: {
                    type: 'object',
                    // Sww https://swagger.io/docs/specification/data-models/data-types/#null
                    nullable: true,
                }
            }
        };
    }
    let decoded;
    try {
        decoded = JSON.parse(responseContent);
    }
    catch (e) { // Decoding failed, so we return the content string as is
        return {
            'text/plain': {
                schema: {
                    type: 'string',
                    example: responseContent,
                }
            }
        };
    }
    let type = getTypeForOpenAPI(decoded);
    switch (type) {
        case 'null':
            return {
                'application/json': {
                    schema: {
                        type: 'string',
                        example: responseContent,
                    }
                }
            };
        case 'string':
        case 'boolean':
        case 'number':
        case 'integer':
            return {
                'application/json': {
                    schema: {
                        type,
                        example: decoded,
                    }
                }
            };
        case 'array':
            if (!decoded.length) {
                // empty array
                return {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object', // No better idea what to put here
                            },
                            example: decoded,
                        }
                    }
                };
            }
            // Non-empty array
            return {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            type: getTypeForOpenAPI(decoded[0]),
                        },
                        example: decoded,
                    }
                }
            };
        case 'object':
            let properties = collect(decoded).mapWithKeys((value, key) => {
                var _a;
                const spec = {
                    // Note that we aren't recursing for nested objects. We stop at one level.
                    type: getTypeForOpenAPI(value),
                    example: value,
                };
                if ((_a = endpoint.responseFields[key]) === null || _a === void 0 ? void 0 : _a.description) {
                    spec.description = endpoint.responseFields[key].description;
                }
                if (spec.type === 'array' && value.length) {
                    spec.items = { type: getTypeForOpenAPI(value[0]) };
                }
                return [key, spec];
            }).all();
            if (!properties.length) {
                properties = EMPTY;
            }
            return {
                'application/json': {
                    schema: {
                        type: 'object',
                        example: decoded,
                        properties: properties,
                    },
                },
            };
    }
}
function generateEndpointResponsesSpec(endpoint) {
    // See https://swagger.io/docs/specification/describing-responses/
    const responses = {};
    endpoint.responses.forEach(response => {
        // OpenAPI groups responses by status code
        // Only one response type per status code, so only the last one will be used
        if (Number(response.status) === 204) {
            // Must not add content for 204
            responses['204'] = {
                description: getResponseDescription(response),
            };
        }
        else {
            responses[response.status.toString()] = {
                description: getResponseDescription(response),
                content: generateResponseContentSpec(response.content, endpoint),
            };
        }
    });
    // return object rather than empty array, so can get properly serialised as object
    return Object.keys(responses).length > 0 ? responses : EMPTY;
}
function generateEndpointRequestBodySpec(endpoint) {
    const body = {
        content: {},
    };
    let schema = {
        type: 'object',
        properties: {},
    };
    let hasRequiredParameter = false;
    let hasFileParameter = false;
    for (let name in endpoint.nestedBodyParameters) {
        let details = endpoint.nestedBodyParameters[name];
        if (name === "[]") { // Request body is an array
            hasRequiredParameter = true;
            schema = generateFieldData(details);
            break;
        }
        if (details.required) {
            hasRequiredParameter = true;
            // Don't declare this earlier.
            // OAS does not support an empty `required` array. Must have something there.
            schema.required = (schema.required || []).concat(name);
        }
        let fieldData = {};
        if (details.type === 'file') {
            hasFileParameter = true;
        }
        fieldData = generateFieldData(details);
        schema.properties[name] = fieldData;
    }
    body.required = hasRequiredParameter;
    let contentType = '';
    if (hasFileParameter) {
        // If there are file parameters, content type changes to multipart
        contentType = 'multipart/form-data';
    }
    else if (endpoint.headers['Content-Type']) {
        contentType = endpoint.headers['Content-Type'];
    }
    else {
        contentType = 'application/json';
    }
    body.content[contentType] = { schema };
    // return object rather than empty array, so can get properly serialised as object
    return body;
}
function getTypeForOpenAPI(value) {
    if (Array.isArray(value)) {
        return 'array';
    }
    if (value === null) {
        // null is not an allowed type in OpenAPI
        return 'string';
    }
    if (Number.isInteger(value)) {
        return 'integer';
    }
    return typeof value;
}
function generateFieldData(field) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (field.type === 'file') {
        // See https://swagger.io/docs/specification/describing-request-body/file-upload/
        return {
            type: 'string',
            format: 'binary',
            description: (_a = field.description) !== null && _a !== void 0 ? _a : '',
        };
    }
    else if (p.isArrayType(field.type)) {
        const baseType = p.getBaseTypeFromArrayType(field.type);
        const baseItem = (baseType === 'file') ? {
            type: 'string',
            format: 'binary',
        } : { type: baseType };
        const fieldData = {
            type: 'array',
            description: (_b = field.description) !== null && _b !== void 0 ? _b : '',
            example: (_c = field.example) !== null && _c !== void 0 ? _c : null,
            items: p.isArrayType(baseType)
                ? generateFieldData({
                    name: '',
                    type: baseType,
                    example: ((_d = field.example) !== null && _d !== void 0 ? _d : [null])[0]
                })
                : baseItem,
        };
        if (field.type.replace(/\[]/g, "") === 'file') {
            // Don't include example for file params in OAS; it's hard to translate it correctly
            delete fieldData.example;
        }
        if (baseType === 'object' && field.__fields) {
            // @ts-ignore
            if (fieldData.items.type === 'object') {
                // @ts-ignore
                fieldData.items.properties = {};
            }
            Object.entries(field.__fields).forEach(([subfieldSimpleName, subfield]) => {
                // @ts-ignore
                fieldData.items.properties[subfieldSimpleName] = generateFieldData(subfield);
                if (subfield.required) {
                    // @ts-ignore
                    fieldData.items.required = (fieldData.items.required || []).concat(subfieldSimpleName);
                }
            });
        }
        return fieldData;
    }
    else if (field.type === 'object') {
        return {
            type: 'object',
            description: (_e = field.description) !== null && _e !== void 0 ? _e : '',
            example: (_f = field.example) !== null && _f !== void 0 ? _f : null,
            properties: collect(Object.entries(field.__fields)).mapWithKeys(([subfieldSimpleName, subfield]) => {
                return [subfieldSimpleName, generateFieldData(subfield)];
            }).all(),
        };
    }
    else {
        return {
            type: p.normalizeTypeName(field.type),
            description: (_g = field.description) !== null && _g !== void 0 ? _g : '',
            example: (_h = field.example) !== null && _h !== void 0 ? _h : null,
        };
    }
}
module.exports = (config) => {
    function makeOpenAPISpec(groupedEndpoints) {
        const spec = Object.assign({
            openapi: OPENAPI_SCHEMA_VERSION,
            info: {
                title: config.title,
                description: config.description || '',
                version: '1.0.0',
            },
            servers: [
                {
                    url: config.baseUrl.replace(/\/$/, ''),
                }
            ],
            paths: generatePathsSpec(groupedEndpoints),
        }, generateSecurityPartialSpec(config));
        return spec;
    }
    function generatePathsSpec(groupedEndpoints) {
        // flatten into a single array
        const allEndpoints = collect(groupedEndpoints).map(g => g.endpoints).flatten(1);
        // OpenAPI groups endpoints by path, then method
        const groupedByPath = allEndpoints.groupBy((endpoint) => {
            const path = endpoint.uri.replace(/(:.+)?\?/g, "$1"); // Remove optional parameters indicator in p
            return '/' + path.replace(/^\//, '');
        });
        return groupedByPath.map((endpoints, path) => {
            const operations = endpoints.mapWithKeys((endpoint) => {
                const spec = {
                    summary: endpoint.metadata.title,
                    description: endpoint.metadata.description || '',
                    parameters: generateEndpointParametersSpec(endpoint),
                    responses: generateEndpointResponsesSpec(endpoint),
                    tags: [endpoint.metadata.groupName],
                };
                if (endpoint.bodyParameters && Object.keys(endpoint.bodyParameters).length) {
                    spec.requestBody = generateEndpointRequestBodySpec(endpoint);
                }
                if (!endpoint.metadata.authenticated) {
                    // Make sure to exclude non-auth endpoints from auth
                    spec.security = [];
                }
                return [endpoint.httpMethods[0].toLowerCase(), spec];
            });
            const pathItem = operations;
            // Placing all URL parameters at the path level, since it's the same path anyway
            if (endpoints.get(0).urlParameters) {
                const parameters = [];
                Object.entries(endpoints.get(0).urlParameters).forEach(([name, details]) => {
                    const parameterData = {
                        in: 'path',
                        name: name,
                        description: details.description || '',
                        example: details.example || null,
                        // Currently, Swagger requires path parameters to be required
                        required: true,
                        schema: {
                            type: p.normalizeTypeName(details.type) || 'string',
                        },
                    };
                    // Workaround for optional parameters
                    if (!details.required) {
                        parameterData.description = ('Optional parameter. ' + (parameterData.description || '')).trim();
                        parameterData.examples = {
                            omitted: {
                                summary: 'When the value is omitted',
                                value: '',
                            },
                        };
                        if (parameterData.example !== null) {
                            parameterData.examples.present = {
                                summary: 'When the value is present',
                                value: parameterData.example,
                            };
                        }
                        // Can't have `example` and `examples`
                        delete parameterData.example;
                    }
                    parameters.push(parameterData);
                });
                pathItem.parameters = parameters;
            }
            return pathItem.all();
        }).all();
    }
    return {
        VERSION: OPENAPI_SCHEMA_VERSION,
        makeOpenAPISpec,
    };
};
//# sourceMappingURL=openapi.js.map