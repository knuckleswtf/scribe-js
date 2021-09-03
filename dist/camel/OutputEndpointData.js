'use strict';
const set = require("../tools").set;
const p = require("../utils/parameters");
class OutputEndpointData {
    constructor(endpoint) {
        this.uri = '';
        this.httpMethods = [];
        this.metadata = {};
        this.headers = {};
        this.urlParameters = {};
        this.queryParameters = {};
        this.bodyParameters = {};
        this.responses = [];
        this.responseFields = {};
        this.boundUri = '';
        this.nestedBodyParameters = {};
        this.cleanUrlParameters = {};
        this.cleanQueryParameters = {};
        this.cleanBodyParameters = {};
        this.fileParameters = {};
        this.uri = endpoint.uri;
        this.httpMethods = endpoint.httpMethods;
        this.metadata = endpoint.metadata;
        this.headers = endpoint.headers;
        this.urlParameters = endpoint.urlParameters;
        this.queryParameters = endpoint.queryParameters;
        this.bodyParameters = endpoint.bodyParameters;
        this.responses = this.normalizeResponses(endpoint.responses);
        this.responseFields = endpoint.responseFields;
        this.nestedBodyParameters = this.nestArrayAndObjectFields(this.bodyParameters);
        this.cleanBodyParameters = p.cleanParams(this.bodyParameters);
        this.cleanQueryParameters = p.cleanParams(this.queryParameters);
        this.cleanUrlParameters = p.cleanParams(this.urlParameters);
        this.boundUri = OutputEndpointData.getUrlWithBoundParameters(this.uri, this.urlParameters);
        let [files, regularParameters] = OutputEndpointData.getFileParameters(this.cleanBodyParameters);
        this.cleanBodyParameters = regularParameters;
        this.fileParameters = files;
    }
    static fromExtractedEndpointObject(endpoint) {
        return new OutputEndpointData(endpoint);
    }
    static getUrlWithBoundParameters(uri, urlParameters) {
        return Object.entries(urlParameters || {})
            .reduce((uri, [name, details]) => {
            return uri.replace(new RegExp(`:${name}\\??`), details.example || '');
        }, uri);
    }
    get endpointId() {
        return this.httpMethods[0] + this.uri.replace(/[/?{}:]/g, '-');
    }
    /**
     * Transform body parameters such that object fields have a `fields` property containing a list of all subfields
     * Subfields will be removed from the main parameter map
     * For instance, if parameters is {dad: {}, 'dad.cars': {}, 'dad.age': {}},
     * normalise this into {dad: {..., __fields: {'dad.cars': {}, {'dad.age': {}}}
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
                let parentName = parts.join('.').replace(/\[]$/g, '');
                // When the body is an array, param names will be "[].paramname",
                // so parentName is empty. Let's fix that.
                if (!parentName) {
                    parentName = '[]';
                }
                if (normalisedParameters[parentName] === undefined) {
                    normalisedParameters[parentName] = {
                        name: parentName,
                        type: parentName === '[]' ? "object[]" : "object",
                        description: "",
                        required: true,
                        example: { [fieldName]: parameter.example },
                    };
                }
            }
            normalisedParameters[name] = parameter;
        }
        let finalParameters = {};
        for (let [name, parameter] of Object.entries(normalisedParameters)) {
            if (name.includes('.')) { // Likely an object field
                // Get the various pieces of the name
                const parts = name.split('.');
                let [fieldName, ...parentPath] = [...parts].reverse();
                const baseName = parentPath.reverse().join('.__fields.');
                // For subfields, the type is indicated in the source object
                // eg test.items[].more and test.items.more would both have parent field with name `items` and containing __fields => more
                // The difference would be in the parent field's `type` property (object[] vs object)
                // So we can get rid of all [] to get the parent name
                let dotPathToParent = baseName.replace('[]', '');
                // When the body is an array, param names will be  "[].paramname",
                // so parts is ['[]']
                if (parts[0] == '[]') {
                    dotPathToParent = '[]' + dotPathToParent;
                }
                const lodashPath = dotPathToParent + '.__fields.' + fieldName;
                set(finalParameters, lodashPath, parameter);
            }
            else { // A regular field, not a subfield of anything
                parameter.__fields = {};
                finalParameters[name] = parameter;
            }
        }
        // Finally, if the body is an array, remove any other items.
        if (finalParameters['[]']) {
            finalParameters = { "[]": finalParameters['[]'] };
        }
        return finalParameters;
    }
    hasFiles() {
        return Object.keys(this.fileParameters || {}).length > 0;
    }
    isArrayBody() {
        const keys = Object.keys(this.nestedBodyParameters || {});
        return keys.length === 1 && keys[0] === "[]";
    }
    static getFileParameters(parameters) {
        const files = {};
        const regularParameters = {};
        for (let name in parameters) {
            let example = parameters[name];
            if (example.___filePath) {
                files[name] = example.___filePath;
            }
            else if (Array.isArray(example) || typeof example === 'object') {
                let [subFiles, subRegulars] = OutputEndpointData.getFileParameters(example);
                for (let subName in subFiles) {
                    const subExample = subFiles[subName];
                    if (!files[name])
                        files[name] = {};
                    files[name][subName] = subExample;
                }
                for (let subName in subRegulars) {
                    const subExample = subRegulars[subName];
                    if (!regularParameters[name])
                        regularParameters[name] = {};
                    regularParameters[name][subName] = subExample;
                }
            }
            else {
                regularParameters[name] = example;
            }
        }
        return [files, regularParameters];
    }
    normalizeResponses(responses) {
        return responses.map(r => {
            // When coming from Camel files, users may specify a JSON object as response content
            if (typeof r.content === "object" && r.content != null) {
                r.content = JSON.stringify(r.content);
            }
            return r;
        });
    }
}
module.exports = OutputEndpointData;
//# sourceMappingURL=OutputEndpointData.js.map