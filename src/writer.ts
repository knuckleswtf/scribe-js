import {scribe} from "../typedefs/core";
import path = require("path");
import fs = require("fs");
import set = require("lodash.set");
import tools = require('./tools');
import OutputEndpointData from "./camel/OutputEndpointData";

class Writer {
    constructor(private config: scribe.Config) {

    }

    async writeDocs(groupedEndpoints?: Group[]) {
        await this.writeHTMLDocs(groupedEndpoints);
        await this.writePostmanCollection(groupedEndpoints);
        await this.writeOpenAPISpec(groupedEndpoints);
    }

    async writePostmanCollection(groupedEndpoints: Group[]) {
        if (!this.config.postman.enabled) {
            return;
        }

        tools.info(`Writing Postman collection to ${path.resolve(this.config.outputPath)}...`);

        const postman = require("./writers/postman")(this.config);
        const collection = postman.makePostmanCollection(groupedEndpoints);

        const overrides = this.config.postman.overrides || {};
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => {
                set(collection, key, value);
            });
        }

        const content = JSON.stringify(collection, null, 4)
        const outputPath = path.resolve(this.config.outputPath);
        fs.writeFileSync(outputPath + '/collection.json', content);

        tools.success("Postman collection generated.");
    }

    async writeOpenAPISpec(groupedEndpoints: Group[]) {
        if (this.config.openapi.enabled) {
            return;
        }

        tools.info(`Writing OpenAPI spec to ${path.resolve(this.config.outputPath)}...`);

        const openapi = require("./writers/openapi")(this.config);
        const spec = openapi.makeOpenAPISpec(groupedEndpoints);

        const overrides = this.config.openapi.overrides || {};
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => {
                set(spec, key, value);
            });
        }

        const yaml = require('js-yaml');
        const content = await yaml.dump(spec, {
            schema: yaml.JSON_SCHEMA,
            skipInvalid: true,
            noRefs: true,
        });
        const outputPath = path.resolve(this.config.outputPath);
        fs.writeFileSync(outputPath + '/openapi.yaml', content);

        tools.success("OpenAPI spec generated.");
    }

    async writeHTMLDocs(groupedEndpoints: Group[]) {
        const HtmlWriter = require("./writers/html");
        const html = new HtmlWriter(this.config);
        await html.generate(groupedEndpoints);
        tools.success(`Generated documentation to ${path.resolve(this.config.outputPath)}.`);
    }
}

export = Writer;


type Group = {
    name: string,
    description?: string,
    fileName?: string,
    endpoints: OutputEndpointData[]
};