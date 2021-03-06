"use strict";
const path = require("path");
const fs = require("fs");
const set = require("lodash.set");
const tools = require("./tools");
module.exports = {
    async writePostmanCollectionFile(config, groupedEndpoints) {
        tools.info(`Writing Postman collection to ${path.resolve(config.outputPath)}...`);
        const postman = require("./writers/postman")(config);
        const collection = postman.makePostmanCollection(groupedEndpoints);
        const overrides = config.postman.overrides || {};
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => {
                set(collection, key, value);
            });
        }
        const content = JSON.stringify(collection, null, 4);
        const outputPath = path.resolve(config.outputPath);
        fs.writeFileSync(outputPath + '/collection.json', content);
        tools.success("Postman collection generated.");
    },
    async writeOpenAPISpecFile(config, groupedEndpoints) {
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
    async writeMarkdownAndHTMLDocs(config, groupedEndpoints, shouldOverwriteMarkdownFiles = false) {
        const sourceOutputPath = path.resolve('docs');
        if (groupedEndpoints) {
            const markdown = require("./writers/markdown")(config);
            markdown.writeDocs(groupedEndpoints, sourceOutputPath, shouldOverwriteMarkdownFiles);
        }
        const pastel = require('@knuckleswtf/pastel');
        await pastel.generate(sourceOutputPath + '/index.md', path.resolve(config.outputPath));
        fs.copyFileSync(path.join(__dirname, '../resources/js/tryitout.js'), path.join(path.resolve(config.outputPath), 'js/tryitout-' + process.env.SCRIBE_VERSION + '.js'));
    },
    /**
     * Transform body parameters such that object fields have a `fields` property containing a list of all subfields
     * Subfields will be removed from the main parameter map
     * For instance, if parameters is {dad: {}, 'dad.cars': {}, 'dad.age': {}},
     * normalise this into {dad: {..., __fields: {'dad.cars': {}, {'dad.age': {}}}
     *
     * @param parameters
     */
    nestArrayAndObjectFields(parameters = {}) {
        // First, we'll make sure all object fields have parent fields properly set
        const normalisedParameters = {};
        for (let [name, parameter] of Object.entries(parameters)) {
            if (name.includes('.')) {
                // Get the various pieces of the name
                const parts = name.split('.');
                const fieldName = parts.pop();
                // If the user didn't add a parent field, we'll conveniently add it for them
                const parentName = parts.join('.').replace(/\[]$/g, '');
                if (parameters[parentName] === undefined) {
                    normalisedParameters[parentName] = {
                        name: parentName,
                        type: "object",
                        description: "",
                        required: false,
                        value: { [fieldName]: parameter.value },
                    };
                }
            }
            normalisedParameters[name] = parameter;
        }
        const finalParameters = {};
        for (let [name, parameter] of Object.entries(normalisedParameters)) {
            if (name.includes('.')) { // Likely an object field
                // Get the various pieces of the name
                const parts = name.split('.');
                let [fieldName, ...parentPath] = parts.reverse();
                const baseName = parentPath.reverse().join('.__fields.');
                // For subfields, the type is indicated in the source object
                // eg test.items[].more and test.items.more would both have parent field with name `items` and containing __fields => more
                // The difference would be in the parent field's `type` property (object[] vs object)
                // So we can get rid of all [] to get the parent name
                const dotPathToParent = baseName.replace('[]', '');
                const lodashPath = dotPathToParent + '.__fields.' + fieldName;
                set(finalParameters, lodashPath, parameter);
            }
            else { // A regular field, not a subfield of anything
                finalParameters[name] = parameter;
            }
        }
        return finalParameters;
    }
};
//# sourceMappingURL=writer.js.map