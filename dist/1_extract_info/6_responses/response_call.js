"use strict";
const fs = require("fs");
const path = require("path");
const qs = require("querystring");
function shouldMakeResponseCall(config, endpoint, routeGroup) {
    // If there's already a success response, don't make a response call
    if (endpoint.responses.find(r => r.status >= 200 && r.status <= 300)) {
        return false;
    }
    const allowedMethods = routeGroup.apply.responseCalls.methods;
    // @ts-ignore
    if (allowedMethods.includes('*') || allowedMethods.includes(endpoint.methods[0].toUpperCase())) {
        return true;
    }
    return false;
}
async function run(endpoint, config, routeGroup) {
    if (!shouldMakeResponseCall(config, endpoint, routeGroup)) {
        return [];
    }
    return makeResponseCall(routeGroup.apply.responseCalls, endpoint);
}
function makeResponseCall(responseCallRules, endpoint) {
    configureEnvironment(responseCallRules);
    setAuthFieldProperly(endpoint);
    const bodyParameters = Object.assign({}, endpoint.cleanBodyParameters || {}, responseCallRules.bodyParams || {});
    const queryParameters = Object.assign({}, endpoint.cleanQueryParameters || {}, responseCallRules.queryParams || {});
    // todo file params
    console.log("Hitting " + endpoint.uri);
    const http = require('http');
    let responseContent;
    const requestOptions = {
        method: endpoint.methods[0],
        headers: Object.assign({ 'user-agent': 'curl/7.22.0' }, endpoint.headers),
        path: endpoint.boundUri + (Object.keys(queryParameters).length ? `?` + qs.stringify(queryParameters) : ''),
    };
    const promise = new Promise((resolve, reject) => {
        const req = http.request(responseCallRules.baseUrl, requestOptions, (res) => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                responseContent = data;
                resolve({
                    status: res.statusCode,
                    content: responseContent
                });
            });
        })
            .on("error", (err) => {
            reject(err);
        })
            .setTimeout(5000);
        if (Object.keys(bodyParameters).length) {
            req.write(JSON.stringify(bodyParameters));
        }
        req.end();
    });
    return promise.then(response => {
        return [response];
    }).catch((err) => {
        console.log("Error during response call: " + err.message);
        return [];
    });
}
function configureEnvironment(responseCallRules) {
    const docsEnvFile = path.resolve(".env.docs");
    if (fs.existsSync(docsEnvFile)) {
        require('dotenv').config({ path: docsEnvFile });
    }
    if (responseCallRules.env) {
        for (let [key, value] of Object.entries(responseCallRules.env)) {
            process.env[key] = value;
        }
    }
}
function setAuthFieldProperly(endpoint) {
    if (!endpoint.auth) {
        return;
    }
    const [where, name, value] = endpoint.auth.split('.', 3);
    endpoint[where][name] = value;
    return;
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=response_call.js.map