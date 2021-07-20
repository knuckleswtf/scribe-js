'use strict';
const p = require("./utils/parameters");
const tools = require("./tools");
const Endpoint = require("./camel/Endpoint");
const OutputEndpointData = require("./camel/OutputEndpointData");
const camel = require("./camel/camel");
const union = require('lodash.union');
const { Listr } = require('listr2');
class Extractor {
    constructor(config, router, serverStartCommand) {
        this.config = config;
        this.router = router;
        this.serverStartCommand = serverStartCommand;
        this.endpointGroupIndexes = {};
    }
    async extract(routesToDocument, cachedEndpoints, latestEndpointsData, groups) {
        // Initialise faker with seed if present
        require('./utils/faker')(this.config.fakerSeed);
        const strategies = this.getStrategies();
        const parsedEndpoints = [];
        const taskList = routesToDocument.map(([endpointDetails, rulesToApply]) => {
            let endpoint = new Endpoint(endpointDetails);
            rulesToApply.responseCalls.serverStartCommand = this.serverStartCommand;
            return {
                title: "Processing route " + endpoint.name(),
                options: { persistentOutput: true, },
                task: async (ctx, task) => {
                    try {
                        // console.log() and friends don't play well with Listr's updating output
                        tools.spoofConsoleLogForTask(task);
                        await this.iterateOverStrategies('metadata', strategies.metadata, endpoint, rulesToApply);
                        await this.iterateOverStrategies('headers', strategies.headers, endpoint, rulesToApply);
                        await this.iterateOverStrategies('urlParameters', strategies.urlParameters, endpoint, rulesToApply);
                        endpoint.cleanUrlParameters = p.cleanParams(endpoint.urlParameters);
                        endpoint.cleanUpUrl();
                        await this.iterateOverStrategies('queryParameters', strategies.queryParameters, endpoint, rulesToApply);
                        endpoint.cleanQueryParameters = p.cleanParams(endpoint.queryParameters);
                        await this.iterateOverStrategies('bodyParameters', strategies.bodyParameters, endpoint, rulesToApply);
                        endpoint.cleanBodyParameters = p.cleanParams(endpoint.bodyParameters);
                        let [files, regularParameters] = OutputEndpointData.getFileParameters(endpoint.cleanBodyParameters);
                        endpoint.fileParameters = files;
                        endpoint.cleanBodyParameters = regularParameters;
                        if (Object.keys(endpoint.cleanBodyParameters).length && !endpoint.headers['Content-Type']) {
                            // Set content type if the user forgot to set it
                            endpoint.headers['Content-Type'] = 'application/json';
                        }
                        if (Object.keys(endpoint.fileParameters).length) {
                            // If there are files, content type has to change
                            endpoint.headers['Content-Type'] = 'multipart/form-data';
                        }
                        this.addAuthField(endpoint);
                        await this.iterateOverStrategies('responses', strategies.responses, endpoint, rulesToApply);
                        await this.iterateOverStrategies('responseFields', strategies.responseFields, endpoint, rulesToApply);
                        let index;
                        // If latest data is different from cached data, merge latest into current
                        [endpoint, index] = this.mergeAnyEndpointDataUpdates(endpoint, cachedEndpoints, latestEndpointsData, groups);
                        // We need to preserve order of endpoints, in case user did custom sorting
                        parsedEndpoints.push(endpoint);
                        if (index !== null) {
                            this.endpointGroupIndexes[endpoint.endpointId] = index;
                        }
                    }
                    catch (e) {
                        Extractor.encounteredErrors = true;
                        // Listr needs us to throw an error for it to mark a task as failed
                        // But it will also print the error message, leading to double printing
                        let errorMessage = `Failed processing route: ${endpoint.name()} - Error encountered: `;
                        errorMessage += "\n" + tools.formatErrorMessageForListr(e);
                        e.message = errorMessage;
                        throw e;
                    }
                },
            };
        });
        const tasks = new Listr(taskList, {
            concurrent: false,
            exitOnError: false,
            rendererSilent: process.env.SCRIBE_TEST === "1",
            rendererOptions: { formatOutput: 'wrap', removeEmptyLines: false }
        });
        await tasks.run();
        tools.restoreConsoleMethods();
        return parsedEndpoints;
    }
    async iterateOverStrategies(stage, strategies, endpoint, rulesToApply) {
        for (let strategyName of strategies) {
            const strategyClassOrObject = require(strategyName);
            let data = null;
            if ('run' in strategyClassOrObject) {
                // Simple object with a `run` method and `routers` list
                if (strategyClassOrObject.routers == null
                    || strategyClassOrObject.routers.length == 0
                    || strategyClassOrObject.routers.includes(this.router)) {
                    data = await strategyClassOrObject.run(endpoint, this.config, rulesToApply, this.router);
                }
            }
            else {
                // Strategy class
                const strategy = new strategyClassOrObject(this.config);
                data = await strategy.invoke(endpoint, rulesToApply, this.router);
            }
            endpoint.add(stage, data);
        }
    }
    getStrategies() {
        const stages = [
            'metadata',
            'headers',
            'urlParameters',
            'queryParameters',
            'bodyParameters',
            'responses',
            'responseFields',
        ];
        const defaultStrategies = {
            metadata: ['./extractors/1_metadata/docblocks'],
            headers: [
                './extractors/2_headers/routegroup_apply',
                './extractors/2_headers/header_tag',
            ],
            urlParameters: [
                './extractors/3_url_parameters/urlparam_tag',
            ],
            queryParameters: [
                './extractors/4_query_parameters/queryparam_tag',
            ],
            bodyParameters: [
                './extractors/5_body_parameters/read_source_code',
                './extractors/5_body_parameters/bodyparam_tag',
            ],
            responses: [
                './extractors/6_responses/response_tag',
                './extractors/6_responses/responsefile_tag',
                './extractors/6_responses/response_call',
            ],
            responseFields: [
                './extractors/7_response_fields/responsefield_tag'
            ],
        };
        return Object.fromEntries(stages.map(stage => {
            // Important to prepend it so docblock strategies can override framework-inferred
            var _a, _b;
            return [stage, union((_b = (_a = this.config.strategies) === null || _a === void 0 ? void 0 : _a[stage]) !== null && _b !== void 0 ? _b : [], defaultStrategies[stage])];
        }));
    }
    addAuthField(endpoint) {
        const isApiAuthed = this.config.auth.enabled;
        if (!isApiAuthed || !endpoint.metadata.authenticated) {
            return;
        }
        const strategy = this.config.auth.in;
        const parameterName = this.config.auth.name;
        const faker = require('./utils/faker')();
        const token = faker.helpers.shuffle('abcdefghkvaZVDPE1864563'.split('')).join('');
        let valueToUse = this.config.auth.useValue;
        if (typeof valueToUse == 'function') {
            valueToUse = valueToUse();
        }
        const valueToDisplay = this.config.auth.placeholder;
        switch (strategy) {
            case 'query':
                endpoint.auth = ['cleanQueryParameters', parameterName, valueToUse || token];
                endpoint.queryParameters[parameterName] = {
                    name: parameterName,
                    example: valueToDisplay || token,
                    type: 'string',
                    description: '',
                    required: true,
                };
                break;
            case 'body':
                endpoint.auth = ['cleanBodyParameters', parameterName, valueToUse || token];
                endpoint.bodyParameters[parameterName] = {
                    name: parameterName,
                    example: valueToDisplay || token,
                    type: 'string',
                    description: '',
                    required: true,
                };
                break;
            case 'bearer':
                endpoint.auth = ['headers', 'Authorization', `Bearer ${valueToUse || token}`];
                endpoint.headers.Authorization = `Bearer ${valueToDisplay || token}`;
                break;
            case 'basic':
                const encodedToken = Buffer.from(token).toString('base64');
                endpoint.auth = ['headers', 'Authorization', `Basic ${valueToUse || encodedToken}`];
                endpoint.headers.Authorization = `Basic ${valueToDisplay || encodedToken}`;
                break;
            case 'header':
                endpoint.auth = ['headers', parameterName, valueToUse || token];
                endpoint.headers[parameterName] = valueToDisplay || token;
                break;
        }
    }
    mergeAnyEndpointDataUpdates(endpoint, cachedEndpoints, latestEndpointsData, groups) {
        // First, find the corresponding endpoint in cached and latest
        const thisEndpointCached = cachedEndpoints.find((cachedEndpoint) => {
            return cachedEndpoint.uri === endpoint.uri
                && String(cachedEndpoint.httpMethods) === String(endpoint.httpMethods);
        });
        if (!thisEndpointCached) {
            return [endpoint, null];
        }
        let thisEndpointLatest = latestEndpointsData.find(latestEndpoint => {
            return latestEndpoint.uri === endpoint.uri
                && String(latestEndpoint.httpMethods) == String(endpoint.httpMethods);
        });
        if (!thisEndpointLatest) {
            return [endpoint, null];
        }
        // Then compare cached and latest to see what sections changed.
        const properties = [
            'metadata',
            'headers',
            'urlParameters',
            'queryParameters',
            'bodyParameters',
            'responses',
            'responseFields',
        ];
        const changed = [];
        properties.forEach(property => {
            if (JSON.stringify(thisEndpointCached[property]) != JSON.stringify(thisEndpointLatest[property])) {
                changed.push(property);
            }
        });
        // Finally, merge any changed sections.
        // @ts-ignore
        thisEndpointLatest = new OutputEndpointData(thisEndpointLatest);
        changed.forEach(property => {
            endpoint[property] = thisEndpointLatest[property];
        });
        // @ts-ignore
        const index = camel.getEndpointIndexInGroup(groups, thisEndpointLatest);
        return [endpoint, index];
    }
}
Extractor.encounteredErrors = false;
module.exports = Extractor;
//# sourceMappingURL=extractor.js.map