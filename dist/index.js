"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = { generate };
const spawn = require("cross-spawn");
const matcher = require("matcher");
const path = require("path");
const url = require("url");
const d = require("./utils/docblocks");
const p = require("./utils/parameters");
const { isPortTaken } = require('./utils/response_calls');
const log = require('debug')('lib:scribe');
function generate(endpoints, config, router, serverFile, shouldOverwriteMarkdownFiles = false) {
    if (router == 'express' && !serverFile) {
        console.log("WARNING: You didn't specify a server file. This means that either your app is started by your app file, or you forgot.");
        console.log("If you forgot, you'll need to specify a server file for response calls to work.");
    }
    config.routes.forEach(async (routeGroup) => {
        let endpointsToDocument = [];
        for (let e of endpoints) {
            if (routeGroup.exclude.length) {
                const shouldExclude = matcher.isMatch(e.uri, routeGroup.exclude);
                if (shouldExclude)
                    continue;
            }
            if (!(matcher.isMatch(e.uri, routeGroup.include)))
                continue;
            // Done in here to prevent docblock parsing for endpoints which have already been excluded
            e.docblock = await d.getDocBlockForEndpoint(e) || {};
            if (e.docblock.hideFromApiDocs === true) {
                continue;
            }
            endpointsToDocument.push(e);
        }
        const strategies = config.strategies || {
            metadata: [
                require('./1_extract_info/1_metadata/docblocks'),
            ],
            headers: [
                require('./1_extract_info/2_headers/routegroup_apply'),
                require('./1_extract_info/2_headers/header_tag'),
            ],
            urlParameters: [
                require('./1_extract_info/3_url_parameters/express_route_api'),
                require('./1_extract_info/3_url_parameters/adonis_route_api'),
                require('./1_extract_info/3_url_parameters/url_param_tag'),
            ],
            queryParameters: [
                require('./1_extract_info/4_query_parameters/query_param_tag'),
            ],
            bodyParameters: [
                require('./1_extract_info/5_body_parameters/read_source_code'),
                require('./1_extract_info/5_body_parameters/body_param_tag'),
            ],
            responses: [
                require('./1_extract_info/6_responses/response_tag'),
                require('./1_extract_info/6_responses/responsefile_tag'),
                require('./1_extract_info/6_responses/response_call'),
            ],
            responseFields: [
                require('./1_extract_info/7_response_fields/response_field_tag'),
            ],
        };
        let appProcess;
        for (let endpoint of endpointsToDocument) {
            endpoint.metadata = {};
            for (let metadataStrategy of strategies.metadata) {
                if (shouldUseWithRouter(metadataStrategy, router)) {
                    endpoint.metadata = Object.assign({}, endpoint.metadata, await metadataStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.headers = {};
            for (let headersStrategy of strategies.headers) {
                if (shouldUseWithRouter(headersStrategy, router)) {
                    endpoint.headers = Object.assign({}, endpoint.headers, await headersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.urlParameters = {};
            for (let urlParametersStrategy of strategies.urlParameters) {
                if (shouldUseWithRouter(urlParametersStrategy, router)) {
                    endpoint.urlParameters
                        = Object.assign({}, endpoint.urlParameters, await urlParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            // Replace parameters in URL
            // match = string to match in URL string
            // placeholder = what to replace it with for docs
            // value = what to replace it with for examples
            endpoint.boundUri = Object.values(endpoint.urlParameters)
                .reduce((uri, p) => {
                // Optional parameters with no value won't get substituted
                return uri.replace(p.match, p.value == null ? '' : p.value);
            }, endpoint.uri);
            endpoint.uri = Object.values(endpoint.urlParameters)
                .reduce((uri, p) => {
                return p.placeholder ? uri.replace(p.match, p.placeholder) : uri;
            }, endpoint.uri);
            endpoint.queryParameters = {};
            for (let queryParametersStrategy of strategies.queryParameters) {
                if (shouldUseWithRouter(queryParametersStrategy, router)) {
                    endpoint.queryParameters
                        = Object.assign({}, endpoint.queryParameters, await queryParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.cleanQueryParameters = p.removeEmptyOptionalParametersAndTransformToKeyValue(endpoint.queryParameters);
            endpoint.bodyParameters = {};
            for (let bodyParametersStrategy of strategies.bodyParameters) {
                if (shouldUseWithRouter(bodyParametersStrategy, router)) {
                    endpoint.bodyParameters
                        = Object.assign({}, endpoint.bodyParameters, await bodyParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.cleanBodyParameters = p.removeEmptyOptionalParametersAndTransformToKeyValue(endpoint.bodyParameters);
            addAuthField(endpoint, config);
            if (serverFile && !appProcess) {
                // Using a single global app process here to avoid premature kills
                const taken = await isPortTaken(url.parse(routeGroup.apply.responseCalls.baseUrl).port);
                if (!taken) {
                    try {
                        console.log("Starting app server for response calls...");
                        appProcess = spawn('node', [serverFile], { stdio: 'ignore' });
                        await new Promise(res => {
                            // Assuming it takes at most 2 seconds to start
                            setTimeout(res, 2000);
                        });
                    }
                    catch (e) {
                        // do nothing; app is probably running already
                    }
                }
            }
            endpoint.responses = [];
            for (let responsesStrategy of strategies.responses) {
                if (shouldUseWithRouter(responsesStrategy, router)) {
                    const responses = await responsesStrategy.run(endpoint, config, routeGroup);
                    endpoint.responses = endpoint.responses.concat(responses);
                }
            }
            endpoint.responseFields = {};
            for (let responseFieldsStrategy of strategies.responseFields) {
                if (shouldUseWithRouter(responseFieldsStrategy, router)) {
                    endpoint.responseFields
                        = Object.assign({}, endpoint.responseFields, await responseFieldsStrategy.run(endpoint, config, routeGroup));
                }
            }
        }
        setTimeout(() => {
            if (appProcess) {
                console.log("Stopping app server...");
                appProcess.kill();
            }
        }, 3000);
        const groupBy = require('lodash.groupby');
        const groupedEndpoints = groupBy(endpointsToDocument, 'metadata.groupName');
        const markdown = require("./2_write_output/markdown")(config);
        const sourceOutputPath = path.resolve('docs');
        markdown.writeDocs(groupedEndpoints, sourceOutputPath, shouldOverwriteMarkdownFiles);
        const pastel = require('@knuckleswtf/pastel');
        await pastel.generate(sourceOutputPath + '/index.md', path.resolve(config.outputPath));
        if (config.postman.enabled) {
            console.log(`Writing postman collection to ${path.resolve(config.outputPath)}...`);
            const postman = require("./2_write_output/postman")(config);
            postman.writePostmanCollectionFile(groupedEndpoints, path.resolve(config.outputPath));
            console.log("Postman collection generated,");
        }
    });
}
function shouldUseWithRouter(strategy, currentRouter) {
    if (strategy.routers == null || strategy.routers.length == 0) {
        return true;
    }
    return strategy.routers.includes(currentRouter);
}
function addAuthField(endpoint, config) {
    endpoint.auth = null;
    const isApiAuthed = config.auth.enabled;
    if (!isApiAuthed || !endpoint.metadata.authenticated) {
        return;
    }
    const strategy = config.auth.in;
    const parameterName = config.auth.name;
    const faker = require('faker');
    // todo use faker seed if present
    const token = faker.helpers.shuffle('abcdefghkvaZVDPE1864563'.split('')).join('');
    let valueToUse = config.auth.useValue;
    if (typeof valueToUse == 'function') {
        valueToUse = valueToUse();
    }
    switch (strategy) {
        case 'query':
            endpoint.auth = `cleanQueryParameters.${parameterName}.${valueToUse || token}`;
            endpoint.queryParameters[parameterName] = {
                name: parameterName,
                value: token,
                type: 'string',
                description: '',
                required: true,
            };
            break;
        case 'body':
            endpoint.auth = `cleanBodyParameters.${parameterName}.${valueToUse || token}`;
            endpoint.bodyParameters[parameterName] = {
                name: parameterName,
                value: token,
                type: 'string',
                description: '',
                required: true,
            };
            break;
        case 'bearer':
            endpoint.auth = `headers.Authorization.Bearer ${valueToUse || token}`;
            endpoint.headers.Authorization = `Bearer ${token}`;
            break;
        case 'basic':
            const encodedToken = Buffer.from(token).toString('base64');
            endpoint.auth = `headers.Authorization.Basic ${valueToUse || encodedToken}`;
            endpoint.headers.Authorization = `Basic ${encodedToken}`;
            break;
        case 'header':
            endpoint.auth = `headers.${parameterName}.${valueToUse || token}`;
            endpoint.headers[parameterName] = token;
            break;
    }
    return;
}
//# sourceMappingURL=index.js.map