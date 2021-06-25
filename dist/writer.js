"use strict";
const path = require("path");
const fs = require("fs");
const set = require("lodash.set");
const tools = require("./tools");
class Writer {
    constructor(config) {
        this.config = config;
    }
    async writeDocs(groupedEndpoints) {
        await this.writeHTMLDocs(groupedEndpoints);
        await this.writePostmanCollection(groupedEndpoints);
        await this.writeOpenAPISpec(groupedEndpoints);
    }
    async writePostmanCollection(groupedEndpoints) {
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
        const content = JSON.stringify(collection, null, 4);
        const outputPath = path.resolve(this.config.outputPath);
        fs.writeFileSync(outputPath + '/collection.json', content);
        tools.success("Postman collection generated.");
    }
    async writeOpenAPISpec(groupedEndpoints) {
        if (!this.config.openapi.enabled) {
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
    async writeHTMLDocs(groupedEndpoints) {
        const HtmlWriter = require("./writers/html");
        const html = new HtmlWriter(this.config);
        await html.generate(groupedEndpoints);
        tools.success(`Generated documentation to ${path.resolve(this.config.outputPath)}.`);
    }
}
module.exports = Writer;
//# sourceMappingURL=writer.js.map