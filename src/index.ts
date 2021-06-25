import Endpoint from "./camel/Endpoint";

require('hard-rejection')();

import {scribe} from "../typedefs/core";

export {scribe} from "../typedefs/core";

import matcher = require('matcher');
import path = require('path');
import fs = require("fs");

import d = require("./utils/docblocks");
import tools = require('./tools');
import Writer = require("./writer");
import Extractor = require("./extractor");
import OutputEndpointData = require("./camel/OutputEndpointData");
import camel = require('./camel/camel');

const debug = require('debug')('lib:scribe');

const defaultOptions = {force: false, noExtraction: false};
process.env.SCRIBE_VERSION = process.env.SCRIBE_VERSION || require('../package.json').version;

class Scribe {
    constructor(
        public config: scribe.Config,
        public router: scribe.SupportedRouters,
        public endpoints: scribe.Route[],
        private serverStartCommand?: string,
        private options = defaultOptions
    ) {
    }

    async generate() {
        if (this.router === 'express' && !this.serverStartCommand) {
            tools.warn("We couldn't find a way to run your API. This means response calls won't work.");
            tools.warn("You can specify a server file with the `-s` flag.");
        }

        let groupedEndpoints: Group[] = [];
        if (this.options.force) {
            groupedEndpoints = await this.extractEndpointsInfoAndWriteToDisk(false);
            await this.extractAndWriteApiDetailsToDisk(!this.options.force);
        } else if (!this.options.noExtraction) {
            groupedEndpoints = await this.extractEndpointsInfoAndWriteToDisk(true);
            await this.extractAndWriteApiDetailsToDisk(!this.options.force);
        } else {
            if (!fs.existsSync(camel.camelDir)) {
                tools.error(`Can't use --no-extraction because there are no endpoints in the ${camel.camelDir} directory.`);
                process.exit(1);
            }
            groupedEndpoints = camel.loadEndpointsIntoGroups(camel.camelDir);
        }

        const userDefinedEndpoints = camel.loadUserDefinedEndpoints(camel.camelDir);
        groupedEndpoints = this.mergeUserDefinedEndpoints(groupedEndpoints, userDefinedEndpoints);
        const writer = new Writer(this.config);
        await writer.writeDocs(groupedEndpoints);

        if (Extractor.encounteredErrors) {
            tools.warn('Generated docs, but encountered some errors while processing routes.');
            tools.warn('Check the output above for details.');
            return;
        }

        console.log();
        tools.info(`You can view your docs locally by opening ${path.resolve(this.config.outputPath, 'index.html')} in your browser`)
    }

    async getRoutesToDocument() {
        let endpointsToDocument: [scribe.Route, scribe.RouteGroupApply][] = [];
        for (let routeGroup of this.config.routes) {
            for (let e of this.endpoints) {
                if (routeGroup.exclude.length) {
                    const shouldExclude = matcher.isMatch(e.uri, routeGroup.exclude);
                    if (shouldExclude) continue;
                }

                if (!(matcher.isMatch(e.uri, routeGroup.include))) continue;

                // Done in here to prevent docblock parsing for endpoints which have already been excluded
                e.docblock = await d.getDocBlockForEndpoint(e);

                if (e.docblock.hideFromApiDocs === true) {
                    continue;
                }

                endpointsToDocument.push([e, routeGroup.apply]);
            }
        }

        return endpointsToDocument;
    }

    async extractEndpointsInfoAndWriteToDisk(preserveUserChanges: boolean): Promise<Group[]> {
        let latestEndpointsData: Endpoint[] = [];
        let cachedEndpoints: Endpoint[] = [];
        let groups: Group[] = [];

        if (preserveUserChanges
            && fs.existsSync(camel.camelDir) && fs.existsSync(camel.cacheDir)) {
            latestEndpointsData = camel.loadEndpointsToFlatPrimitivesArray(camel.camelDir);
            cachedEndpoints = camel.loadEndpointsToFlatPrimitivesArray(camel.cacheDir, true);
            groups = camel.loadEndpointsIntoGroups(camel.camelDir);
        }

        const routes = await this.getRoutesToDocument();
        const extractor = new Extractor(this.config, this.router, this.serverStartCommand);

        let parsedEndpoints = await extractor.extract(routes, cachedEndpoints, latestEndpointsData, groups);

        let groupedEndpoints = camel.groupEndpoints(parsedEndpoints, extractor.endpointGroupIndexes);

        await camel.writeEndpointsToDisk(groupedEndpoints);
        await camel.writeExampleCustomEndpoint();
        return camel.prepareGroupedEndpointsForOutput(groupedEndpoints);
    }

    async extractAndWriteApiDetailsToDisk(preserveUserChanges: boolean) {
        const markdown = require("./writers/markdown")(this.config, ".scribe", preserveUserChanges);
        await markdown.writeIntroAndAuthFiles();
    }

    mergeUserDefinedEndpoints(groupedEndpoints: Group[], userDefinedEndpoints: Endpoint[]): Group[] {
        userDefinedEndpoints.forEach(endpoint => {
            const existingGroupKey = groupedEndpoints.findIndex((group) => {
                return group.name === endpoint.metadata.groupName ?? (this.config.defaultGroup || '');
            });

            if (existingGroupKey > -1) {
                groupedEndpoints[existingGroupKey].endpoints.push(OutputEndpointData.fromExtractedEndpointObject(endpoint));
            } else {
                groupedEndpoints.push({
                    name: endpoint.metadata.groupName ?? (this.config.defaultGroup || ''),
                    description: endpoint.metadata.groupDescription ?? null,
                    endpoints: [OutputEndpointData.fromExtractedEndpointObject(endpoint)],
                });
            }
        });

        return groupedEndpoints;
    }
}


module.exports = {
    generate(
        endpoints: scribe.Route[],
        config: scribe.Config,
        router: scribe.SupportedRouters,
        serverStartCommand?: string,
        options = defaultOptions
    ) {
        return (new Scribe(
            config,
            router,
            endpoints,
            serverStartCommand,
            options
        )).generate();
    }
};

type Group = {
    name: string,
    description?: string,
    fileName?: string,
    endpoints: OutputEndpointData[],
};