"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('hard-rejection')();
const matcher = require("matcher");
const groupBy = require("lodash.groupby");
const path = require("path");
const d = require("./utils/docblocks");
const tools = require("./tools");
const writer = require("./writer");
const Extractor = require("./extractor");
const debug = require('debug')('lib:scribe');
const defaultOptions = { overwriteMarkdownFiles: false, noExtraction: false };
process.env.SCRIBE_VERSION = process.env.SCRIBE_VERSION || require('../package.json').version;
class Scribe {
    constructor(config, router, endpoints, serverStartCommand, options = defaultOptions) {
        this.config = config;
        this.router = router;
        this.endpoints = endpoints;
        this.serverStartCommand = serverStartCommand;
        this.options = options;
    }
    async generate() {
        if (this.options.noExtraction) {
            return writer.writeMarkdownAndHTMLDocs(this.config);
        }
        if (this.router === 'express' && !this.serverStartCommand) {
            tools.warn("We couldn't find a way to run your API. This means response calls won't work.");
            tools.warn("You can specify a server file with the `-s` flag.");
        }
        const routes = await this.getRoutesToDocument();
        const extractor = new Extractor(this.config, this.router, routes, this.serverStartCommand);
        let parsedEndpoints = await extractor.extract();
        parsedEndpoints = parsedEndpoints.map(e => {
            e.nestedBodyParameters = writer.nestArrayAndObjectFields(e.bodyParameters);
            return e;
        });
        const groupedEndpoints = groupBy(parsedEndpoints, 'metadata.groupName');
        const Camel = require('./camel');
        const camel = new Camel(this.config);
        // await camel.writeEndpointsToDisk(groupedEndpoints);
        await camel.extractAndWriteApiDetailsToDisk(this.options.overwriteMarkdownFiles);
        // await writer.writeMarkdownAndHTMLDocs(this.config, groupedEndpoints, this.options.overwriteMarkdownFiles);
        if (this.config.postman.enabled) {
            await writer.writePostmanCollectionFile(this.config, groupedEndpoints);
        }
        if (this.config.openapi.enabled) {
            await writer.writeOpenAPISpecFile(this.config, groupedEndpoints);
        }
        console.log();
        tools.info(`You can view your docs locally by opening ${path.resolve(this.config.outputPath, 'index.html')} in your browser`);
    }
    async getRoutesToDocument() {
        let endpointsToDocument = [];
        for (let routeGroup of this.config.routes) {
            for (let e of this.endpoints) {
                if (routeGroup.exclude.length) {
                    const shouldExclude = matcher.isMatch(e.uri, routeGroup.exclude);
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
}
module.exports = {
    generate(endpoints, config, router, serverStartCommand, options = defaultOptions) {
        return (new Scribe(config, router, endpoints, serverStartCommand, options)).generate();
    }
};
//# sourceMappingURL=index.js.map