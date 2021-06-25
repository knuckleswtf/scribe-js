'use strict';

import {scribe} from "../../typedefs/core";
import OutputEndpointData = require("./OutputEndpointData");

const sortBy = require("lodash.sortby");

class Endpoint {
    uri = '';
    httpMethods: scribe.HttpMethods[] = [];
    metadata: scribe.Metadata = {};
    headers: scribe.Headers = {};
    urlParameters: scribe.UrlParameters = {};
    queryParameters: scribe.QueryParameters = {};
    bodyParameters: scribe.BodyParameters = {};
    responses: scribe.Response[] = [];
    responseFields: scribe.ResponseFields = {};
    docblock: Partial<scribe.DocBlock>;
    originalRoute: any;
    /**
     * Authentication info for this endpoint. In the form [{where}, {name}, {sample}]
     * Example: ["queryParameters", "api_key", "njiuyiw97865rfyvgfvb1"]
     */
    auth: [string, string, string] = null;
    cleanQueryParameters: Record<string, any> = {};
    cleanBodyParameters: Record<string, any> = {};
    cleanUrlParameters: Record<string, any> = {};
    fileParameters: Record<string, any> = {};
    handler: Function;

    constructor(endpointDetails: scribe.Route) {
        this.uri = endpointDetails.uri;
        this.httpMethods = endpointDetails.httpMethods;
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
                const hiddenHeaders = [
                    'date',
                    'Date',
                    'etag',
                    'ETag',
                    'last-modified',
                    'Last-Modified',
                    'date',
                    'Date',
                    'content-length',
                    'Content-Length',
                    'connection',
                    'Connection',
                    'x-powered-by',
                    'X-Powered-By',
                ];

                data.forEach(response => {
                    if (response.headers) {
                        hiddenHeaders.forEach(headerName => {
                            delete response.headers[headerName];
                        });
                    }
                });
                this.responses = sortBy(this.responses.concat(data), 'status');
                break;
            default:
                this[stage] = Object.assign({}, this[stage], data);
        }
    }

    // Some URL parameters are written in an "ugly" way (eg /users/:id([a-z]+) )
    // We need to clean up the URL (to /users/:id)
    // match = string to match in URL string
    // placeholder = what to replace it with for docs
    // value = what to replace it with for examples
    cleanUpUrl() {
        this.uri = Object.values(this.urlParameters)
            .reduce((uri, p) => {
                return p.placeholder ? uri.replace(p.match, p.placeholder) : uri;
            }, this.uri);
    }

    get endpointId(): string {
        return this.httpMethods[0] + this.uri.replace(/[/?{}:]/g, '-');
    }

    forSerialisation() {
        const copy = Object.assign({}, this, {
            // Get rid of all duplicate data
            cleanQueryParameters: undefined,
            cleanUrlParameters: undefined,
            cleanBodyParameters: undefined,
            fileParameters: undefined,
            // and objects used only in extraction
            docblock: undefined,
            originalRoute: undefined,
            auth: undefined,
        });
        copy.metadata = Object.assign({}, copy.metadata, {
            groupName: undefined, groupDescription: undefined
        });
        return copy;
    }
}

export = Endpoint;