'use strict';

import {scribe} from "../../typedefs/core";
import Endpoint from "./Endpoint";

const set = require("../tools").set;
import p = require("../utils/parameters");

class OutputEndpointData {
    uri = '';
    httpMethods: scribe.HttpMethods[] = [];
    metadata: scribe.Metadata = {};
    headers: scribe.Headers = {};
    urlParameters: scribe.UrlParameters = {};
    queryParameters: scribe.QueryParameters = {};
    bodyParameters: scribe.BodyParameters = {};
    responses: scribe.Response[] = [];
    responseFields: scribe.ResponseFields = {};
    boundUri = '';
    nestedBodyParameters: scribe.ParameterBag<scribe.BodyParameter> = {};
    cleanUrlParameters: Record<string, any> = {};
    cleanQueryParameters: Record<string, any> = {};
    cleanBodyParameters: Record<string, any> = {};
    fileParameters: Record<string, any> = {};

    constructor(endpoint: Endpoint) {
        this.uri = endpoint.uri;
        this.httpMethods = endpoint.httpMethods;
        this.metadata = endpoint.metadata;
        this.headers = endpoint.headers;
        this.urlParameters = endpoint.urlParameters;
        this.queryParameters = endpoint.queryParameters;
        this.bodyParameters = endpoint.bodyParameters;
        this.responses = endpoint.responses;
        this.responseFields = endpoint.responseFields;

        this.nestedBodyParameters = this.nestArrayAndObjectFields(this.bodyParameters);
        this.cleanBodyParameters = p.cleanParams(this.bodyParameters);
        this.cleanQueryParameters = p.cleanParams(this.queryParameters);
        this.cleanUrlParameters = p.cleanParams(this.urlParameters);
        this.boundUri = OutputEndpointData.getUrlWithBoundParameters(this.cleanUrlParameters, this.uri);

        // let [files, regularParameters] = collect(this.cleanBodyParameters)
        //     .partition((param) => (p.getBaseType(param.type) == 'file'));
        // files = files.all();
        // regularParameters = regularParameters.all();
//
        // this.cleanBodyParameters = regularParameters.all();
        // this.fileParameters = files.all();

    }

    static fromExtractedEndpointObject(endpoint: Endpoint) {
        return new OutputEndpointData(endpoint);
    }

    // TODO check that this works
    static getUrlWithBoundParameters(cleanUrlParameters: Record<string,any>, uri: string) {
        return Object.values(cleanUrlParameters)
            .reduce((uri, [name, example]) => {
                return uri.replace(`:${name}`, example);
            }, uri);
    }

    get endpointId(): string {
        return this.httpMethods[0] + this.uri.replace(/[/?{}:]/g, '-');
    }

    /**
     * Transform body parameters such that object fields have a `fields` property containing a list of all subfields
     * Subfields will be removed from the main parameter map
     * For instance, if parameters is {dad: {}, 'dad.cars': {}, 'dad.age': {}},
     * normalise this into {dad: {..., __fields: {'dad.cars': {}, {'dad.age': {}}}
     */
    nestArrayAndObjectFields(parameters: scribe.ParameterBag = {}) {
        // First, we'll make sure all object fields have parent fields properly set
        const normalisedParameters: scribe.ParameterBag = {};
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
                        example: {[fieldName]: parameter.example},
                    };
                }
            }
            normalisedParameters[name] = parameter;
        }

        let finalParameters: scribe.ParameterBag = {};
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
            } else { // A regular field, not a subfield of anything
                parameter.__fields = {};
                finalParameters[name] = parameter;
            }

        }

        // Finally, if the body is an array, remove any other items.
        if (finalParameters['[]']) {
            finalParameters = {"[]": finalParameters['[]']};
        }

       // console.log(finalParameters);
        return finalParameters;
    }

    hasFiles() {
        return Object.keys(this.fileParameters || {}).length > 0;
    }
}

export = OutputEndpointData;