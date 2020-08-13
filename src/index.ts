module.exports = {generate};

import {scribe} from "../typedefs/core";

import spawn = require('cross-spawn');
import matcher = require('matcher');
import path = require('path');
import url = require('url');
import union = require('lodash.union');

import d = require("./utils/docblocks");
import p = require('./utils/parameters');
import tools = require('./tools');

const {isPortTaken} = require('./utils/response_calls');

const log = require('debug')('lib:scribe');

async function generate(
    endpoints: scribe.Endpoint[],
    config: scribe.Config,
    router: scribe.SupportedRouters,
    serverFile?: string,
    shouldOverwriteMarkdownFiles: boolean = false,
) {
    if (router == 'express' && !serverFile) {
        tools.warn("You didn't specify a server file. This means that either your app is started by your app file, or you forgot.");
        tools.warn("If you forgot, you'll need to specify a server file for response calls to work.");
    }

    const strategies = getStrategies(config);
    const parsedEndpoints = (await Promise.all(config.routes.map(async (routeGroup) => {
        let endpointsToDocument: scribe.Endpoint[] = [];

        for (let e of endpoints) {
            if (routeGroup.exclude.length) {
                const shouldExclude = matcher.isMatch(e.uri, routeGroup.exclude);
                if (shouldExclude) continue;
            }

            if (!(matcher.isMatch(e.uri, routeGroup.include))) continue;

            // Done in here to prevent docblock parsing for endpoints which have already been excluded
            e.docblock = await d.getDocBlockForEndpoint(e) || {} as scribe.DocBlock;

            if (e.docblock.hideFromApiDocs === true) {
                continue;
            }

            endpointsToDocument.push(e);
        }

        let appProcess;
        for (let endpoint of endpointsToDocument) {
            endpoint.metadata = {};
            for (let strategyName of strategies.metadata) {
                const metadataStrategy = require(strategyName) as scribe.MetadataStrategy;
                if (shouldUseWithRouter(metadataStrategy, router)) {
                    endpoint.metadata = Object.assign({}, endpoint.metadata, await metadataStrategy.run(endpoint, config, routeGroup));
                }
            }

            endpoint.headers = {};
            for (let strategyName of strategies.headers) {
                const headersStrategy = require(strategyName) as scribe.HeadersStrategy;
                if (shouldUseWithRouter(headersStrategy, router)) {
                    endpoint.headers = Object.assign({}, endpoint.headers, await headersStrategy.run(endpoint, config, routeGroup));
                }
            }

            endpoint.urlParameters = {};
            for (let strategyName of strategies.urlParameters) {
                const urlParametersStrategy = require(strategyName) as scribe.UrlParametersStrategy;
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
                const queryParametersStrategy = require(strategyName) as scribe.QueryParametersStrategy;
                if (shouldUseWithRouter(queryParametersStrategy, router)) {
                    endpoint.queryParameters
                        = Object.assign({}, endpoint.queryParameters, await queryParametersStrategy.run(endpoint, config, routeGroup));
                }
            }
            endpoint.cleanQueryParameters = p.removeEmptyOptionalParametersAndTransformToKeyValue(endpoint.queryParameters);

            endpoint.bodyParameters = {};
            for (let strategyName of strategies.bodyParameters) {
                const bodyParametersStrategy = require(strategyName) as scribe.BodyParametersStrategy;
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
                        appProcess = spawn('node', [serverFile], {stdio: 'ignore'});
                        await new Promise(res => {
                            // Assuming it takes at most 2 seconds to start
                            setTimeout(res, 2000);
                        });
                    } catch (e) {
                        // do nothing; app is probably running already
                    }
                }
            }

            endpoint.responses = [];
            for (let strategyName of strategies.responses) {
                const responsesStrategy = require(strategyName) as scribe.ResponsesStrategy;
                if (shouldUseWithRouter(responsesStrategy, router)) {
                    const responses = await responsesStrategy.run(endpoint, config, routeGroup)
                    endpoint.responses = endpoint.responses.concat(responses);
                }
            }

            endpoint.responseFields = {};
            for (let strategyName of strategies.responseFields) {
                const responseFieldsStrategy = require(strategyName) as scribe.ResponseFieldsStrategy;
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
    const groupedEndpoints: { [groupName: string]: scribe.Endpoint[] } = groupBy(parsedEndpoints, 'metadata.groupName');

    const markdown = require("./2_write_output/markdown")(config);
    const sourceOutputPath = path.resolve('docs');
    markdown.writeDocs(groupedEndpoints, sourceOutputPath, shouldOverwriteMarkdownFiles);

    const pastel = require('@knuckleswtf/pastel');
    await pastel.generate(sourceOutputPath + '/index.md', path.resolve(config.outputPath));

    if (config.postman.enabled) {
        tools.info(`Writing postman collection to ${path.resolve(config.outputPath)}...`);
        const postman = require("./2_write_output/postman")(config);
        postman.writePostmanCollectionFile(groupedEndpoints, path.resolve(config.outputPath));
        tools.success("Postman collection generated.");
    }

    console.log();
    tools.info(`You can view your docs locally by opening file:///${path.resolve(config.outputPath, 'index.html').replace(/\\/g, '/')} in your browser`)
}


function getStrategies(config: scribe.Config) {
    const metadata = union([
        './1_extract_info/1_metadata/docblocks',
    ], config?.strategies?.metadata ?? []);
    const headers = union([
        './1_extract_info/2_headers/routegroup_apply',
        './1_extract_info/2_headers/header_tag',
    ], config?.strategies?.headers ?? []);
    const urlParameters = union([
        './1_extract_info/3_url_parameters/url_param_tag',
    ], config?.strategies?.urlParameters ?? []);
    const queryParameters = union([
        './1_extract_info/4_query_parameters/query_param_tag',
    ], config?.strategies?.queryParameters ?? []);
    const bodyParameters = union([
        './1_extract_info/5_body_parameters/read_source_code',
        './1_extract_info/5_body_parameters/body_param_tag',
    ], config?.strategies?.bodyParameters ?? []);
    const responses = union([
        './1_extract_info/6_responses/response_tag',
        './1_extract_info/6_responses/responsefile_tag',
        './1_extract_info/6_responses/response_call',
    ], config?.strategies?.responses ?? []);
    const responseFields = union([
        './1_extract_info/7_response_fields/response_field_tag'
    ], config?.strategies?.responseFields ?? []);
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

function shouldUseWithRouter(strategy: scribe.Strategy, currentRouter: scribe.SupportedRouters): boolean {
    if (strategy.routers == null || strategy.routers.length == 0) {
        return true;
    }

    return strategy.routers.includes(currentRouter);
}


function addAuthField(endpoint: scribe.Endpoint, config: scribe.Config): void {
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
