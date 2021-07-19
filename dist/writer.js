"use strict";
const path = require("path");
const fs = require("fs");
const set = require("lodash.set");
const { Listr } = require('listr2');
const tools = require("./tools");
class Writer {
    constructor(config) {
        this.config = config;
    }
    async writeDocs(groupedEndpoints) {
        const taskList = [
            {
                title: `Writing HTML docs`,
                options: { persistentOutput: true },
                task: (ctx, task) => {
                    tools.spoofConsoleLogForTask(task);
                    return this.writeHTMLDocs(groupedEndpoints);
                }
            },
            {
                title: `Writing Postman collection`,
                options: { persistentOutput: true },
                task: (ctx, task) => {
                    tools.spoofConsoleLogForTask(task);
                    return this.writePostmanCollection(groupedEndpoints);
                },
                skip: !this.config.postman.enabled,
            },
            {
                title: `Writing OpenAPI spec`,
                options: { persistentOutput: true },
                task: (ctx, task) => {
                    tools.spoofConsoleLogForTask(task);
                    return this.writeOpenAPISpec(groupedEndpoints);
                },
                skip: !this.config.openapi.enabled,
            }
        ];
        const tasks = new Listr(taskList, {
            concurrent: false,
            rendererSilent: process.env.SCRIBE_TEST === "1",
        });
        await tasks.run();
        tools.restoreConsoleMethods();
    }
    async writePostmanCollection(groupedEndpoints) {
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
    }
    async writeOpenAPISpec(groupedEndpoints) {
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
    }
    async writeHTMLDocs(groupedEndpoints) {
        const HtmlWriter = require("./writers/html");
        const html = new HtmlWriter(this.config);
        await html.generate(groupedEndpoints);
    }
}
module.exports = Writer;
//# sourceMappingURL=writer.js.map