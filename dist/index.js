"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = { generate };
const spawn = require("cross-spawn");
const matcher = require("matcher");
const path = require("path");
const url = require("url");
const union = require("lodash.union");
const d = require("./utils/docblocks");
const p = require("./utils/parameters");
const tools = require("./tools");
const writer = require("./writer");
const { isPortTaken } = require('./utils/response_calls');
const log = require('debug')('lib:scribe');
const defaultOptions = { overwriteMarkdownFiles: false, noExtraction: false };
async function generate(endpoints, config, router, serverFile, { overwriteMarkdownFiles, noExtraction } = defaultOptions) {
    if (noExtraction) {
        return writer.writeMarkdownAndHTMLDpcs(config);
    }
    if (router == 'express' && !serverFile) {
        tools.warn("You didn't specify a server file. This means that either your app is started by your app file, or you forgot.");
        tools.warn("If you forgot, you'll need to specify a server file for response calls to work.");
    }
    // Initialise faker with seed if present
    require('./utils/faker')(config.fakerSeed);
    const strategies = getStrategies(config);
    let parsedEndpoints = (await Promise.all(config.routes.map(async (routeGroup) => {
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
        let appProcess;
        for (let endpoint of endpointsToDocument) {
            endpoint.metadata = {};
            for (let strategyName of strategies.metadata) {
                const metadataStrategy = require(strategyName);
                if (shouldUseWithRouter(metadataStrategy, router)) {
                    endpoint.metadata = Object.assign({}, endpoint.metadata, await metadataStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.headers = {};
            for (let strategyName of strategies.headers) {
                const headersStrategy = require(strategyName);
                if (shouldUseWithRouter(headersStrategy, router)) {
                    endpoint.headers = Object.assign({}, endpoint.headers, await headersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.urlParameters = {};
            for (let strategyName of strategies.urlParameters) {
                const urlParametersStrategy = require(strategyName);
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
            for (let strategyName of strategies.queryParameters) {
                const queryParametersStrategy = require(strategyName);
                if (shouldUseWithRouter(queryParametersStrategy, router)) {
                    endpoint.queryParameters
                        = Object.assign({}, endpoint.queryParameters, await queryParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.cleanQueryParameters = p.removeEmptyOptionalParametersAndTransformToKeyExample(endpoint.queryParameters);
            endpoint.bodyParameters = {};
            for (let strategyName of strategies.bodyParameters) {
                const bodyParametersStrategy = require(strategyName);
                if (shouldUseWithRouter(bodyParametersStrategy, router)) {
                    endpoint.bodyParameters
                        = Object.assign({}, endpoint.bodyParameters, await bodyParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.cleanBodyParameters = p.removeEmptyOptionalParametersAndTransformToKeyExample(endpoint.bodyParameters);
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
            for (let strategyName of strategies.responses) {
                const responsesStrategy = require(strategyName);
                if (shouldUseWithRouter(responsesStrategy, router)) {
                    const responses = await responsesStrategy.run(endpoint, config, routeGroup);
                    endpoint.responses = endpoint.responses.concat(responses);
                }
            }
            endpoint.responseFields = {};
            for (let strategyName of strategies.responseFields) {
                const responseFieldsStrategy = require(strategyName);
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
        return endpointsToDocument;
    }))).flat();
    const groupBy = require('lodash.groupby');
    parsedEndpoints = parsedEndpoints.map(e => {
        e.nestedBodyParameters = writer.nestArrayAndObjectFields(e.bodyParameters);
        // @ts-ignore
        e.endpointId = e.methods[0] + e.uri.replace(/[/?{}]/g, '-');
        return e;
    });
    const groupedEndpoints = groupBy(parsedEndpoints, 'metadata.groupName');
    await writer.writeMarkdownAndHTMLDpcs(config, groupedEndpoints, overwriteMarkdownFiles);
    if (config.postman.enabled) {
        await writer.writePostmanCollectionFile(config, groupedEndpoints);
    }
    if (config.openapi.enabled) {
        await writer.writeOpenAPISpecFile(config, groupedEndpoints);
    }
    console.log();
    tools.info(`You can view your docs locally by opening file:///${path.resolve(config.outputPath, 'index.html').replace(/\\/g, '/')} in your browser`);
}
function getStrategies(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const metadata = union([
        './extractors/1_metadata/docblocks',
    ], (_b = (_a = config === null || config === void 0 ? void 0 : config.strategies) === null || _a === void 0 ? void 0 : _a.metadata) !== null && _b !== void 0 ? _b : []);
    const headers = union([
        './extractors/2_headers/routegroup_apply',
        './extractors/2_headers/header_tag',
    ], (_d = (_c = config === null || config === void 0 ? void 0 : config.strategies) === null || _c === void 0 ? void 0 : _c.headers) !== null && _d !== void 0 ? _d : []);
    const urlParameters = union([
        './extractors/3_url_parameters/url_param_tag',
    ], (_f = (_e = config === null || config === void 0 ? void 0 : config.strategies) === null || _e === void 0 ? void 0 : _e.urlParameters) !== null && _f !== void 0 ? _f : []);
    const queryParameters = union([
        './extractors/4_query_parameters/query_param_tag',
    ], (_h = (_g = config === null || config === void 0 ? void 0 : config.strategies) === null || _g === void 0 ? void 0 : _g.queryParameters) !== null && _h !== void 0 ? _h : []);
    const bodyParameters = union([
        './extractors/5_body_parameters/read_source_code',
        './extractors/5_body_parameters/body_param_tag',
    ], (_k = (_j = config === null || config === void 0 ? void 0 : config.strategies) === null || _j === void 0 ? void 0 : _j.bodyParameters) !== null && _k !== void 0 ? _k : []);
    const responses = union([
        './extractors/6_responses/response_tag',
        './extractors/6_responses/responsefile_tag',
        './extractors/6_responses/response_call',
    ], (_m = (_l = config === null || config === void 0 ? void 0 : config.strategies) === null || _l === void 0 ? void 0 : _l.responses) !== null && _m !== void 0 ? _m : []);
    const responseFields = union([
        './extractors/7_response_fields/response_field_tag'
    ], (_p = (_o = config === null || config === void 0 ? void 0 : config.strategies) === null || _o === void 0 ? void 0 : _o.responseFields) !== null && _p !== void 0 ? _p : []);
    return {
        metadata,
        headers,
        urlParameters,
        queryParameters,
        bodyParameters,
        responses,
        responseFields
    };
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
    const faker = require('./utils/faker')();
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