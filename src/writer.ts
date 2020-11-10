import {scribe} from "../typedefs/core";
import path = require("path");
import fs = require("fs");
import set = require("lodash.set");
import tools = require('./tools');

export = {
    async writePostmanCollectionFile(config: scribe.Config, groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }) {
        tools.info(`Writing Postman collection to ${path.resolve(config.outputPath)}...`);

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

        tools.success("Postman collection generated.");
    },

    async writeOpenAPISpecFile(config: scribe.Config, groupedEndpoints: { [groupName: string]: scribe.Endpoint[] }) {
        tools.info(`Writing OpenAPI spec to ${path.resolve(config.outputPath)}...`);

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
            skipInvalid: true,
            noRefs: true,
        });
        const outputPath = path.resolve(config.outputPath);
        fs.writeFileSync(outputPath + '/openapi.yaml', content);

        tools.success("OpenAPI spec generated.");
    },

    async writeMarkdownAndHTMLDpcs(config: scribe.Config, groupedEndpoints?: { [groupName: string]: scribe.Endpoint[] }, shouldOverwriteMarkdownFiles: boolean = false) {
        const sourceOutputPath = path.resolve('docs');
        if (groupedEndpoints) {
            const markdown = require("./writers/markdown")(config);
            markdown.writeDocs(groupedEndpoints, sourceOutputPath, shouldOverwriteMarkdownFiles);
        }

        const pastel = require('@knuckleswtf/pastel');
        await pastel.generate(sourceOutputPath + '/index.md', path.resolve(config.outputPath));
        fs.copyFileSync(path.join(__dirname, '../resources/js/tryitout.js'), path.join(path.resolve(config.outputPath), 'js/tryitout.js'));
    },

    /**
     * Transform body parameters such that object fields have a `fields` property containing a list of all subfields
     * Subfields will be removed from the main parameter map
     * For instance, if parameters is {dad: {}, 'dad.cars': {}, 'dad.age': {}},
     * normalise this into {dad: {..., __fields: {'dad.cars': {}, {'dad.age': {}}}
     *
     * @param parameters
     */
    nestArrayAndObjectFields(parameters: scribe.ParameterBag = {}) {
        const finalParameters: scribe.ParameterBag = {};
        for (let [name, parameter] of Object.entries(parameters)) {
            if (name.includes('.')) { // Likely an object field
                // Get the various pieces of the name
                const parts = name.split('.');
                let [fieldName, ...parentPath] = parts.reverse();

                const baseName = parentPath.reverse().join('.__fields.');
                // The type should be indicated in the source object by now; we don't need it in the name
                const normalisedBaseName = baseName.replace('[]', '.__fields');

                const lodashPath = normalisedBaseName.replace(/\.__fields$/, '') + '.__fields.' + fieldName;
                set(finalParameters, lodashPath, parameter);
            } else { // A regular field
                finalParameters[name] = parameter;
            }

        }

        return finalParameters;
    }
};