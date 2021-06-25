'use strict';
const url = require("url");
const { spawn } = require("child_process");
const union = require('lodash.union');
const collect = require('collect.js');
const { isPortTaken } = require('./utils/response_calls');
const p = require("./utils/parameters");
const tools = require("./tools");
const Endpoint = require("./camel/Endpoint");
const OutputEndpointData = require("./camel/OutputEndpointData");
const camel = require("./camel/camel");
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
        let appProcess;
        const parsedEndpoints = [];
        await Promise.all(routesToDocument.map(async ([endpointDetails, rulesToApply]) => {
            try {
                let endpoint = new Endpoint(endpointDetails);
                await this.iterateOverStrategies('metadata', strategies.metadata, endpoint, rulesToApply);
                await this.iterateOverStrategies('headers', strategies.headers, endpoint, rulesToApply);
                await this.iterateOverStrategies('urlParameters', strategies.urlParameters, endpoint, rulesToApply);
                endpoint.cleanUpUrlParams();
                await this.iterateOverStrategies('queryParameters', strategies.queryParameters, endpoint, rulesToApply);
                endpointDetails.cleanQueryParameters = p.cleanParams(endpointDetails.queryParameters);
                await this.iterateOverStrategies('bodyParameters', strategies.bodyParameters, endpoint, rulesToApply);
                let [files, regularParameters] = collect(endpointDetails.bodyParameters)
                    .partition((param) => (p.getBaseType(param.type) == 'file'));
                files = files.all();
                regularParameters = regularParameters.all();
                endpointDetails.cleanBodyParameters = p.cleanParams(regularParameters);
                if (Object.keys(endpointDetails.cleanBodyParameters).length && !endpointDetails.headers['Content-Type']) {
                    // Set content type if the user forgot to set it
                    endpointDetails.headers['Content-Type'] = 'application/json';
                }
                if (Object.keys(files).length) {
                    // If there are files, content type has to change
                    endpointDetails.headers['Content-Type'] = 'multipart/form-data';
                }
                endpointDetails.fileParameters = p.cleanParams(files);
                this.addAuthField(endpoint);
                if (this.serverStartCommand && !appProcess) {
                    // Using a single global app process here to avoid premature kills
                    const taken = await isPortTaken(url.parse(rulesToApply.responseCalls.baseUrl).port);
                    if (!taken) {
                        try {
                            tools.info(`Starting your app (\`${this.serverStartCommand}\`) for response calls...`);
                            const [command, ...args] = this.serverStartCommand.split(" ");
                            appProcess = spawn(command, args, { stdio: 'ignore', cwd: process.cwd() });
                            await new Promise(resolve => {
                                // Delay for 2s to give the app time to start
                                setTimeout(resolve, 2000);
                            });
                        }
                        catch (e) {
                            // do nothing; app is probably running already
                        }
                    }
                }
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
                tools.error(`Failed processing route: ${endpointDetails.httpMethods} ${endpointDetails.uri} - Exception encountered.`);
                tools.error(e.message);
                tools.error(e.stack.split("\n").slice(0, 4).join("\n"));
            }
        }));
        setTimeout(() => {
            if (appProcess) {
                tools.info("Stopping app server...");
                appProcess.kill();
            }
        }, 3000);
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
            var _a;
            return [stage, union(defaultStrategies[stage], (_a = this.config.strategies[stage]) !== null && _a !== void 0 ? _a : [])];
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