'use strict';
const sortBy = require("lodash.sortby");
class Endpoint {
    constructor(endpointDetails) {
        this.uri = '';
        this.httpMethods = [];
        this.metadata = {};
        this.headers = {};
        this.urlParameters = {};
        this.queryParameters = {};
        this.bodyParameters = {};
        this.responses = [];
        this.responseFields = {};
        /**
         * Authentication info for this endpoint. In the form [{where}, {name}, {sample}]
         * Example: ["queryParameters", "api_key", "njiuyiw97865rfyvgfvb1"]
         */
        this.auth = null;
        this.cleanQueryParameters = {};
        this.cleanBodyParameters = {};
        this.cleanUrlParameters = {};
        this.fileParameters = {};
        this.uri = endpointDetails.uri;
        this.httpMethods = endpointDetails.httpMethods;
        this.docblock = endpointDetails.docblock;
        this.handler = endpointDetails.handler;
        this.originalRoute = endpointDetails.originalRoute;
    }
    add(stage, data) {
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
            let match = p.match ? p.match : new RegExp(`:${p.name}(\\(.*\\))?(?=\\/|$)`);
            let placeholder = p.placeholder ? p.placeholder : (p.required ? `:${p.name}` : `:${p.name}?`);
            return uri.replace(match, placeholder);
        }, this.uri);
    }
    get endpointId() {
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
    name() {
        return `[${this.httpMethods.join(',')}] ${this.uri}`;
    }
}
module.exports = Endpoint;
//# sourceMappingURL=Endpoint.js.map