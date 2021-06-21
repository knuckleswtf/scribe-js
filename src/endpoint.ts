'use strict';

import {scribe} from "../typedefs/core";

const sortBy = require("lodash.sortby");

class Endpoint {
    uri = '';
    methods: string[] = [];
    metadata: scribe.Metadata = {};
    headers: scribe.Headers = {};
    urlParameters: scribe.UrlParameters = {};
    queryParameters: scribe.QueryParameters = {};
    bodyParameters: scribe.BodyParameters = {};
    responses: scribe.Response[] = [];
    responseFields: scribe.ResponseFields = {};
    docblock: Partial<scribe.DocBlock>;
    originalRoute: any;
    boundUri = '';
    /**
     * Authentication info for this endpoint. In the form [{where}, {name}, {sample}]
     * Example: ["queryParameters", "api_key", "njiuyiw97865rfyvgfvb1"]
     */
    auth: [string, string, string] = null;
    nestedBodyParameters: Record<string, any> = {};
    cleanQueryParameters: Record<string, any> = {};
    cleanBodyParameters: Record<string, any> = {};
    fileParameters: Record<string, any> = {};
    handler: Function;

    constructor(endpointDetails: scribe.Route) {
        this.uri = endpointDetails.uri;
        this.methods = endpointDetails.methods;
        this.docblock = endpointDetails.docblock;
        this.handler = endpointDetails.handler;
        this.originalRoute = endpointDetails.originalRoute;
    }

    add(stage: string, data) {
        if (data == null) {
            return;
        }

        switch (stage) {
            case 'responses':
                this.responses = sortBy(this.responses.concat(data), 'status');
                break;
            default:
                this[stage] = Object.assign({}, this[stage], data);
        }
    }

    // Should be called before cleanUpUrlParams()
    setBoundUrl() {
        this.boundUri = Object.values(this.urlParameters)
            .reduce((uri, p) => {
                // Optional parameters with no value won't get substituted
                return uri.replace(p.match, p.value == null ? '' : p.value);
            }, this.uri);
    }

    // Some URL parameters are written in an "ugly" way (eg /users/:id([a-z]+) )
    // We need to clean up the URL (to /users/:id)
    // match = string to match in URL string
    // placeholder = what to replace it with for docs
    // value = what to replace it with for examples
    cleanUpUrlParams() {
        this.uri = Object.values(this.urlParameters)
            .reduce((uri, p) => {
                return p.placeholder ? uri.replace(p.match, p.placeholder) : uri;
            }, this.uri)
    }

    get endpointId(): string {
        return this.methods[0] + this.uri.replace(/[/?{}:]/g, '-');
    }
}

export = Endpoint;