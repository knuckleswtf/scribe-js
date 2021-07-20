"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('hard-rejection')();
const matcher = require("matcher");
const path = require("path");
const fs = require("fs");
const d = require("./utils/docblocks");
const tools = require("./tools");
const Writer = require("./writer");
const Extractor = require("./extractor");
const OutputEndpointData = require("./camel/OutputEndpointData");
const camel = require("./camel/camel");
const defaultOptions = { force: false, noExtraction: false, verbose: false };
process.env.SCRIBE_VERSION = process.env.SCRIBE_VERSION || require('../package.json').version;
class Scribe {
    constructor(config, router, endpoints, serverStartCommand, options = defaultOptions) {
        this.config = config;
        this.router = router;
        this.endpoints = endpoints;
        this.serverStartCommand = serverStartCommand;
        this.options = options;
        tools.setVerbosity(options.verbose);
        // Reset this map (useful for tests)
        camel.groupFileNames = {};
    }
    async generate() {
        if (this.router === 'express' && !this.serverStartCommand && !this.options.noExtraction) {
            tools.warn("You have response calls turned on, but we couldn't find a way to start your server.\n"
                + "You can either start your server manually, or specify its file path with the `--server` flag, \n"
                + "for example, `--server index.js`.");
        }
        let groupedEndpoints = [];
        if (this.options.force) {
            tools.info(`Extracting API details...`);
            groupedEndpoints = await this.extractEndpointsInfoAndWriteToDisk(false);
            await this.extractAndWriteApiDetailsToDisk(!this.options.force);
            tools.info(`Done.`);
        }
        else if (!this.options.noExtraction) {
            tools.info(`Extracting API details...`);
            groupedEndpoints = await this.extractEndpointsInfoAndWriteToDisk(true);
            await this.extractAndWriteApiDetailsToDisk(!this.options.force);
            tools.info(`Done.`);
        }
        else {
            if (!fs.existsSync(camel.camelDir)) {
                tools.error(`Can't use --no-extraction because there's no data in the ${camel.camelDir} directory.`);
                process.exit(1);
            }
            tools.info(`Loading API details from .scribe folder...`);
            groupedEndpoints = camel.loadEndpointsIntoGroups(camel.camelDir);
            tools.success("Done.");
        }
        const userDefinedEndpoints = camel.loadUserDefinedEndpoints(camel.camelDir);
        groupedEndpoints = this.mergeUserDefinedEndpoints(groupedEndpoints, userDefinedEndpoints);
        console.log();
        tools.info(`Writing docs...`);
        const writer = new Writer(this.config);
        await writer.writeDocs(groupedEndpoints);
        if (Extractor.encounteredErrors) {
            tools.warn('Generated docs, but encountered some errors while processing routes.');
            tools.warn('Check the output above for details.');
            return;
        }
        console.log();
        tools.success(`Done. Your docs are in ${path.resolve(this.config.outputPath)}`);
    }
    async getRoutesToDocument() {
        let endpointsToDocument = [];
        for (let routeGroup of this.config.routes) {
            for (let e of this.endpoints) {
                if (routeGroup.exclude.length) {
                    const shouldExclude = routeGroup.exclude.find(pattern => matcher.isMatch(e.uri, pattern));
                    if (shouldExclude)
                        continue;
                }
                if (!(matcher.isMatch(e.uri, routeGroup.include)))
                    continue;
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
    async extractEndpointsInfoAndWriteToDisk(preserveUserChanges) {
        let latestEndpointsData = [];
        let cachedEndpoints = [];
        let groups = [];
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
        camel.writeExampleCustomEndpoint();
        return camel.prepareGroupedEndpointsForOutput(groupedEndpoints);
    }
    async extractAndWriteApiDetailsToDisk(preserveUserChanges) {
        const markdown = require("./writers/markdown")(this.config, ".scribe", preserveUserChanges);
        await markdown.writeIntroAndAuthFiles();
    }
    mergeUserDefinedEndpoints(groupedEndpoints, userDefinedEndpoints) {
        userDefinedEndpoints.forEach(endpoint => {
            var _a, _b;
            const existingGroupKey = groupedEndpoints.findIndex((group) => {
                var _a;
                return (_a = group.name === endpoint.metadata.groupName) !== null && _a !== void 0 ? _a : (this.config.defaultGroup || '');
            });
            if (existingGroupKey > -1) {
                groupedEndpoints[existingGroupKey].endpoints.push(OutputEndpointData.fromExtractedEndpointObject(endpoint));
            }
            else {
                groupedEndpoints.push({
                    name: (_a = endpoint.metadata.groupName) !== null && _a !== void 0 ? _a : (this.config.defaultGroup || ''),
                    description: (_b = endpoint.metadata.groupDescription) !== null && _b !== void 0 ? _b : null,
                    endpoints: [OutputEndpointData.fromExtractedEndpointObject(endpoint)],
                });
            }
        });
        return groupedEndpoints;
    }
}
module.exports = {
    generate(endpoints, config, router, serverStartCommand, options = defaultOptions) {
        return (new Scribe(config, router, endpoints, serverStartCommand, options)).generate();
    }
};
//# sourceMappingURL=index.js.map