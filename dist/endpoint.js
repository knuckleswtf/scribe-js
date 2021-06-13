'use strict';
class Endpoint {
    constructor(endpointDetails) {
        this.uri = '';
        this.methods = [];
        this.metadata = {};
        this.headers = {};
        this.urlParameters = {};
        this.queryParameters = {};
        this.bodyParameters = {};
        this.responses = [];
        this.responseFields = {};
        this.boundUri = '';
        /**
         * Authentication info for this endpoint. In the form [{where}, {name}, {sample}]
         * Example: ["queryParameters", "api_key", "njiuyiw97865rfyvgfvb1"]
         */
        this.auth = null;
        this.nestedBodyParameters = {};
        this.cleanQueryParameters = {};
        this.cleanBodyParameters = {};
        this.fileParameters = {};
        this.uri = endpointDetails.uri;
        this.methods = endpointDetails.methods;
        this.docblock = endpointDetails.docblock;
        this.handler = endpointDetails.handler;
    }
    add(stage, data) {
        if (data == null) {
            return;
        }
        switch (stage) {
            case 'responses':
                this.responses = this.responses.concat(data);
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
        }, this.uri);
    }
    get endpointId() {
        return this.methods[0] + this.uri.replace(/[/?{}:]/g, '-');
    }
}
module.exports = Endpoint;
//# sourceMappingURL=endpoint.js.map