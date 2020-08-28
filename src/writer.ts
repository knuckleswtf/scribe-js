import {scribe} from "../typedefs/core";
import path = require("path");
import fs = require("fs");
import set = require("lodash.set");

export = {
    async writePostmanCollectionFile(groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }, config: scribe.Config) {
        const postman = require("./writers/postman")(config);
        const collection = postman.makePostmanCollection(groupedEndpoints);

        const overrides = config.postman.overrides || {};
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => {
                set(collection, key, value);
            });
        }

        const content = JSON.stringify(collection, null, 4)
        const outputPath = path.resolve(config.outputPath);
        fs.writeFileSync(outputPath + '/collection.json', content);
    },

    async writeOpenAPISpecFile(groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }, config: scribe.Config) {
        const openapi = require("./writers/openapi")(config);
        const spec = openapi.makeOpenAPISpec(groupedEndpoints);

        const overrides = config.openapi.overrides || {};
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => {
                set(spec, key, value);
            });
        }

        const yaml = require('js-yaml');
        const content = await yaml.dump(spec, {
            schema: yaml.JSON_SCHEMA,
            skipInvalid : true,
            noRefs: true,
        });
        const outputPath = path.resolve(config.outputPath);
        fs.writeFileSync(outputPath + '/openapi.yaml', content);
    },

    async writeMarkdownAndHTMLDpcs(groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }, config: scribe.Config, shouldOverwriteMarkdownFiles: boolean = false) {
        const markdown = require("./writers/markdown")(config);
        const sourceOutputPath = path.resolve('docs');
        markdown.writeDocs(groupedEndpoints, sourceOutputPath, shouldOverwriteMarkdownFiles);

        const pastel = require('@knuckleswtf/pastel');
        await pastel.generate(sourceOutputPath + '/index.md', path.resolve(config.outputPath));
    }
};