"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = generate;
const spawn = require("cross-spawn");
const matcher = require("matcher");
const path = require("path");
const d = require("./utils/docblocks");
const log = require('debug')('lib:scribe');
const utils = require("./utils/parameters");
function generate(configFile, appFile, serverFile, shouldOverwriteMarkdownFiles = false) {
    if (!serverFile) {
        console.log("WARNING: You didn't specify a server file. This means that either your app is started by your app file, or you forgot.");
        console.log("If you forgot, you'll need to specify a server file for response calls to work.");
    }
    const config = require(configFile);
    if (!config.router) {
        let router;
        const pkgJson = require(path.resolve('package.json'));
        if ('express' in pkgJson.dependencies) {
            router = 'express';
        }
        config.router = router;
        log(`Detected router: ${router}`);
    }
    const app = require(appFile);
    if (!app._router) {
        console.error("Couldn't find an export from your app file. Did you remember to export your `app` object?");
        process.exit(1);
    }
    if (!app._decoratedByScribe) {
        console.error("Something's not right. Did you remember to add `require('@knuckleswtf/scribe')(app)` before registering your Express routes?");
        process.exit(1);
    }
    config.routes.forEach(async (routeGroup) => {
        const getEndpoints = require(`./1_get_routes/${config.router}`);
        const endpoints = getEndpoints(app);
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
            if (e.docblock.hideFromApiDocs == false) {
                endpointsToDocument.push(e);
            }
        }
        const strategies = config.strategies || {
            metadata: [
                require('./2_extract_info/1_metadata/docblocks'),
            ],
            headers: [
                require('./2_extract_info/2_headers/routegroup_apply'),
                require('./2_extract_info/2_headers/header_tag'),
            ],
            urlParameters: [
                require('./2_extract_info/3_url_parameters/express_route_api'),
                require('./2_extract_info/3_url_parameters/url_param_tag'),
            ],
            queryParameters: [
                require('./2_extract_info/4_query_parameters/query_param_tag'),
            ],
            bodyParameters: [
                require('./2_extract_info/5_body_parameters/read_source_code'),
                require('./2_extract_info/5_body_parameters/body_param_tag'),
            ],
            responses: [
                require('./2_extract_info/6_responses/response_tag'),
                require('./2_extract_info/6_responses/responsefile_tag'),
                require('./2_extract_info/6_responses/response_call'),
            ],
            responseFields: [
                require('./2_extract_info/7_response_fields/response_field_tag'),
            ],
        };
        for (let endpoint of endpointsToDocument) {
            for (let metadataStrategy of strategies.metadata) {
                if (shouldUseWithRouter(metadataStrategy, config.router)) {
                    endpoint.metadata = Object.assign({}, endpoint.metadata, await metadataStrategy.run(endpoint, config, routeGroup));
                }
            }
            for (let headersStrategy of strategies.headers) {
                if (shouldUseWithRouter(headersStrategy, config.router)) {
                    endpoint.headers = Object.assign({}, endpoint.headers, await headersStrategy.run(endpoint, config, routeGroup));
                }
            }
            for (let urlParametersStrategy of strategies.urlParameters) {
                if (shouldUseWithRouter(urlParametersStrategy, config.router)) {
                    endpoint.urlParameters
                        = Object.assign({}, endpoint.urlParameters, await urlParametersStrategy.run(endpoint, config, routeGroup));
                }
                // Replace parameters in URL
                endpoint.boundUri = Object.values(endpoint.urlParameters)
                    .reduce((uri, p) => {
                    // Optional parameters with no value won't get substituted
                    return uri.replace(p.match, p.value == null ? '' : p.value);
                }, endpoint.uri);
                // Replace parameters in URL
                endpoint.uri = Object.values(endpoint.urlParameters)
                    .reduce((uri, p) => {
                    return p.placeholder ? uri.replace(p.match, p.placeholder) : uri;
                }, endpoint.uri);
            }
            for (let queryParametersStrategy of strategies.queryParameters) {
                if (shouldUseWithRouter(queryParametersStrategy, config.router)) {
                    endpoint.queryParameters
                        = Object.assign({}, endpoint.queryParameters, await queryParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.cleanQueryParameters = utils.removeEmptyOptionalParametersAndTransformToKeyValue(endpoint.queryParameters);
            for (let bodyParametersStrategy of strategies.bodyParameters) {
                if (shouldUseWithRouter(bodyParametersStrategy, config.router)) {
                    endpoint.bodyParameters
                        = Object.assign({}, endpoint.bodyParameters, await bodyParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.cleanBodyParameters = utils.removeEmptyOptionalParametersAndTransformToKeyValue(endpoint.bodyParameters);
            addAuthField(endpoint, config);
            let appProcess;
            if (serverFile) {
                // Using a single global app process here to avoid premature kills
                try {
                    appProcess = spawn('node', [serverFile], { stdio: 'inherit' });
                }
                catch (e) {
                    // do nothing; app is probably running already
                }
            }
            endpoint.responses = [];
            for (let responsesStrategy of strategies.responses) {
                if (shouldUseWithRouter(responsesStrategy, config.router)) {
                    const responses = await responsesStrategy.run(endpoint, config, routeGroup);
                    endpoint.responses = endpoint.responses.concat(responses);
                }
            }
            appProcess && appProcess.kill();
            for (let responseFieldsStrategy of strategies.responseFields) {
                if (shouldUseWithRouter(responseFieldsStrategy, config.router)) {
                    endpoint.responseFields
                        = Object.assign({}, endpoint.responseFields, await responseFieldsStrategy.run(endpoint, config, routeGroup));
                }
            }
        }
        const groupBy = require('lodash.groupby');
        const groupedEndpoints = groupBy(endpointsToDocument, 'metadata.groupName');
        const markdown = require("./3_write_output/markdown")(config);
        const sourceOutputPath = path.resolve('docs');
        markdown.writeDocs(groupedEndpoints, sourceOutputPath, shouldOverwriteMarkdownFiles);
        const pastel = require('@knuckleswtf/pastel');
        await pastel.generate(sourceOutputPath + '/index.md', path.resolve(config.outputPath));
        if (config.postman.enabled) {
            console.log(`Writing postman collection to ${path.resolve(config.outputPath)}...`);
            const postman = require("./3_write_output/postman")(config);
            postman.writePostmanCollectionFile(groupedEndpoints, path.resolve(config.outputPath));
            console.log("Postman collection generated,");
        }
    });
}
// Possible (Express, exported app):
// 1. get endpoint
// 2. get url of endpoint
// 3. response calls
// 4. URL Parameters
// 5. Query/body - Scan code for req.body.X, { X } = req.body
// NB - handle sub-apps
// Potential (framework-specific)
// 1. Parameter names and types (from validation)
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
    // config.fakerSeed && faker.seed(config.fakerSeed);
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