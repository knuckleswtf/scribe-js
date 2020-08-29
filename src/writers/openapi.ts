import {scribe} from "../../typedefs/core";

import p = require('../utils/parameters');
import {
    ContentObject,
    OpenAPIObject, OperationObject, ParameterObject, RequestBodyObject, SchemaObject, SecuritySchemeObject
} from "openapi3-ts";

const collect = require('collect.js');

const VERSION = '3.0.3';
const EMPTY = {};

export = (config: scribe.Config) => {

    function makeOpenAPISpec(groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }) {
        const spec: OpenAPIObject = Object.assign({
            openapi: VERSION,
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

    function generatePathsSpec(groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }) {
        // flatten into a single array
        const allEndpoints = collect(groupedEndpoints).flatten(1);
        // OpenAPI groups endpoints by path, then method
        const groupedByPath = allEndpoints.groupBy((endpoint: scribe.Endpoint) => {
            const path = endpoint.uri.replace(/(:.+)?\?/g, "$1"); // Remove optional parameters indicator in p
            return '/' + path.replace(/^\//, '');
        });

        return groupedByPath.map((endpoints, path: string) => {
            const operations = endpoints.mapWithKeys((endpoint: scribe.Endpoint) => {
                const spec: OperationObject = {
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

                return [endpoint.methods[0].toLowerCase(), spec];
            });

            const pathItem = operations;

            // Placing all URL parameters at the path level, since it's the same path anyway
            if (endpoints.get(0).urlParameters) {
                const parameters = [];
                Object.entries(endpoints.get(0).urlParameters).forEach(([name, details]: [string, scribe.Parameter]) => {
                    const parameterData: ParameterObject = {
                        in: 'path',
                        name: name,
                        description: details.description || '',
                        example: details.value || null,
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
                                value: parameterData['example'],
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
        VERSION,
        makeOpenAPISpec,
    };

}


function generateSecurityPartialSpec(config: scribe.Config) {
    const isApiAuthed = config.auth.enabled;
    if (!isApiAuthed) {
        return {};
    }

    const location = config.auth.in;
    const parameterName = config.auth.name;
    let scheme: Partial<SecuritySchemeObject> = {};

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
        components:
            {
                securitySchemes: {
                    // 'default' is an arbitrary name for the auth scheme. Can be anything, really.
                    'default': scheme as SecuritySchemeObject,
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

function generateEndpointParametersSpec(endpoint: scribe.Endpoint) {
    const parameters = [];

    if (endpoint.queryParameters) {
        Object.entries(endpoint.queryParameters).forEach(([name, details]) => {
            const parameterData = {
                in: 'query',
                name: name,
                description: details.description || '',
                example: details.value || null,
                required: details.required || false,
                schema: {
                    type: p.normalizeTypeName(details.type) || 'string',
                },
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

function getResponseDescription(response: scribe.Response): string {
    if (typeof response.content == 'string' && response.content.startsWith("<<binary>>")) {
        return response.content.replace("<<binary>>", "").trim();
    }

    return String(response.description || '');
}

function generateResponseContentSpec(responseContent: string | null, endpoint: scribe.Endpoint): ContentObject {

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
    } catch (e) { // Decoding failed, so we return the content string as is
        return {
            'text/plain': {
                schema: {
                    type: 'string',
                    example: responseContent,
                }
            }
        };
    }

    let type = p.gettype(decoded);
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
                            type: p.gettype(decoded[0]),
                        },
                        example: decoded,
                    }
                }
            };

        case 'object':
            let properties = collect(decoded).mapWithKeys((value, key) => {
                const spec: SchemaObject = {
                    // Note that we aren't recursing for nested objects. We stop at one level.
                    type: p.gettype(value),
                    example: value,

                };
                if (endpoint.responseFields[key]?.description) {
                    spec.description = endpoint.responseFields[key].description;
                }
                if (spec.type === 'array' && value.length) {
                    spec.items = {type: p.gettype(value[0])};
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

function generateEndpointResponsesSpec(endpoint: scribe.Endpoint) {
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
        } else {
            responses[response.status.toString()] = {
                description: getResponseDescription(response),
                content: generateResponseContentSpec(response.content, endpoint),
            };
        }
    });

    // return object rather than empty array, so can get properly serialised as object
    return Object.keys(responses).length > 0 ? responses : EMPTY;
}

function generateEndpointRequestBodySpec(endpoint: scribe.Endpoint): RequestBodyObject {
    const body: Partial<RequestBodyObject> = {
        content: {},
    };

    const schema: SchemaObject = {
        type: 'object',
        properties: {},
    };

    let hasRequiredParameter = false;
    let hasFileParameter = false;

    Object.entries(endpoint.bodyParameters).forEach(([name, details]) => {
        if (details.required) {
            hasRequiredParameter = true;
            // Don't declare this earlier.
            // Can't have an empty `required` array. Must have something there.
            schema.required = (schema.required || []).concat(name);
        }

        let fieldData: SchemaObject = {};
        if (details.type === 'file') {
            // See https://swagger.io/docs/specification/describing-request-body/file-upload/
            hasFileParameter = true;
            fieldData = {
                type: 'string',
                format: 'binary',
                description: details.description ?? '',
            };
        } else {
            fieldData = {
                type: p.normalizeTypeName(details.type),
                description: details.description ?? '',
                example: details.value ?? null,
            };
            if (fieldData.type === 'array') {
                fieldData.items = {
                    type: details.value.length ? p.gettype(details.value[0]) : 'object',
                };
            }
        }

        schema.properties[name] = fieldData;
    });

    body.required = hasRequiredParameter;

    let contentType = '';
    if (hasFileParameter) {
        // If there are file parameters, content type changes to multipart
        contentType = 'multipart/form-data';
    } else if (endpoint.headers['Content-Type']) {
        contentType = endpoint.headers['Content-Type'];
    } else {
        contentType = 'application/json';
    }

    body.content[contentType] = {schema};

    // return object rather than empty array, so can get properly serialised as object
    return body as RequestBodyObject;
}