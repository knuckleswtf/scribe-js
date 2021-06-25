'use strict';


import RouteGroupApply = scribe.RouteGroupApply;

const url = require("url");
const {spawn} = require("child_process");
const union = require('lodash.union');
const collect = require('collect.js');
const {Listr} = require('listr2');

const {isPortTaken} = require('./utils/response_calls');
import p = require("./utils/parameters");
import tools = require('./tools');
import Endpoint = require("./camel/Endpoint");
import Strategy  = require("./strategy");

import {scribe} from "../typedefs/core";
import OutputEndpointData = require("./camel/OutputEndpointData");
import camel = require("./camel/camel");
import {ListrTask} from "listr2";

class Extractor {
    static encounteredErrors = false;
    public endpointGroupIndexes: {};

    constructor(
        public config: scribe.Config,
        public router: scribe.SupportedRouters,
        private serverStartCommand?: string
    ) {
        this.endpointGroupIndexes = {};
    }

    async extract(
        routesToDocument: [scribe.Route, scribe.RouteGroupApply][],
        cachedEndpoints: Endpoint[],
        latestEndpointsData: Endpoint[],
        groups: {
            name: string,
            description?: string,
            fileName?: string,
            endpoints: OutputEndpointData[],
        }[]
    ) {
        // Initialise faker with seed if present
        require('./utils/faker')(this.config.fakerSeed);

        const strategies = this.getStrategies();

        const parsedEndpoints: Endpoint[] = [];

        const taskList = routesToDocument.map(([endpointDetails, rulesToApply]): ListrTask => {
            let endpoint = new Endpoint(endpointDetails);
            rulesToApply.responseCalls.serverStartCommand = this.serverStartCommand;

            return {
                title: "Processing route " + endpoint.name(),
                options: { persistentOutput: true },
                task: async (ctx, task) => {
                    try {
                        await this.iterateOverStrategies('metadata', strategies.metadata, endpoint, rulesToApply);
                        await this.iterateOverStrategies('headers', strategies.headers, endpoint, rulesToApply);
                        await this.iterateOverStrategies('urlParameters', strategies.urlParameters, endpoint, rulesToApply);
                        endpoint.cleanUrlParameters = p.cleanParams(endpoint.urlParameters);

                        endpoint.cleanUpUrl();

                        await this.iterateOverStrategies('queryParameters', strategies.queryParameters, endpoint, rulesToApply);
                        endpoint.cleanQueryParameters = p.cleanParams(endpoint.queryParameters);

                        await this.iterateOverStrategies('bodyParameters', strategies.bodyParameters, endpoint, rulesToApply);
                        let [files, regularParameters] = collect(endpoint.bodyParameters)
                            .partition((param) => (p.getBaseType(param.type) == 'file'));
                        files = files.all();
                        regularParameters = regularParameters.all();

                        endpoint.cleanBodyParameters = p.cleanParams(regularParameters);
                        if (Object.keys(endpoint.cleanBodyParameters).length && !endpoint.headers['Content-Type']) {
                            // Set content type if the user forgot to set it
                            endpoint.headers['Content-Type'] = 'application/json';
                        }
                        if (Object.keys(files).length) {
                            // If there are files, content type has to change
                            endpoint.headers['Content-Type'] = 'multipart/form-data';
                        }
                        endpoint.fileParameters = p.cleanParams(files);

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
                    } catch (e) {
                        Extractor.encounteredErrors = true;
                        const originalErrMessage = e.message;
                        e.message = `Failed processing route: ${endpoint.name()} - Exception encountered:`;
                        // todo When verbose, show full stack
                        task.output = originalErrMessage + "\n" + e.stack.split("\n").slice(0, 4).join("\n");
                        throw e;
                    }
                },
            };
        });

        const tasks = new Listr(taskList, {concurrent: true, exitOnError: false});
        await tasks.run();

        setTimeout(() => {
            const appProcess = require("./extractors/6_responses/response_call").appProcess;
            if (appProcess) {
                tools.info("Stopping app server...");
                appProcess.kill();
            }
        }, 3000);

        return parsedEndpoints;
    }

    async iterateOverStrategies(stage: scribe.Stage, strategies: string[], endpoint: Endpoint, rulesToApply: RouteGroupApply,) {
        for (let strategyName of strategies) {
            const strategyClassOrObject = require(strategyName);

            let data = null;
            if ('run' in strategyClassOrObject) {
                // Simple object with a `run` method and `routers` list
                if (
                    strategyClassOrObject.routers == null
                    || strategyClassOrObject.routers.length == 0
                    || strategyClassOrObject.routers.includes(this.router)
                ) {
                    data = await strategyClassOrObject.run(endpoint, this.config, rulesToApply, this.router);
                }

            } else {
                // Strategy class
                const strategy = new strategyClassOrObject(this.config) as Strategy<{}>;
                data = await strategy.invoke(endpoint, rulesToApply, this.router);
            }
            endpoint.add(stage, data);
        }
    }

    getStrategies(): Record<scribe.Stage, string[]> {
        const stages: scribe.Stage[] = [
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
            return [stage, union(this.config.strategies[stage] ?? [], defaultStrategies[stage])];
        })) as Record<scribe.Stage, string[]>;
    }

    addAuthField(endpoint: Endpoint): void {
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

    mergeAnyEndpointDataUpdates(
        endpoint: Endpoint,
        cachedEndpoints: Endpoint[],
        latestEndpointsData: Endpoint[],
        groups: {
            name: string,
            description?: string,
            fileName?: string,
            endpoints: OutputEndpointData[],
        }[]
    ): [Endpoint, number] {
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

export = Extractor;