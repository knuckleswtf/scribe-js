"use strict";
const fs = require("fs");
const path = require("path");
const qs = require("querystring");
const url = require("url");
const OutputEndpointData = require("../../camel/OutputEndpointData");
const TestingFile = require("../../utils/TestingFile");
const { spawn } = require("cross-spawn");
const { isPortTaken } = require('../../utils/response_calls');
const tools = require('./../../tools');
const { prettyPrintResponseIfJson } = require("../../utils/parameters");
let appProcess;
function run(endpoint, config, routeGroupApply) {
    if (!shouldMakeResponseCall(config, endpoint, routeGroupApply)) {
        return Promise.resolve([]);
    }
    return makeResponseCall(routeGroupApply.responseCalls, endpoint);
}
function shouldMakeResponseCall(config, endpoint, routeGroupApply) {
    // If there's already a success response, don't make a response call
    if (endpoint.responses.find(r => r.status >= 200 && r.status <= 300)) {
        return false;
    }
    const allowedMethods = routeGroupApply.responseCalls.methods;
    return allowedMethods.includes('*') ||
        allowedMethods.includes(endpoint.httpMethods[0].toUpperCase());
}
function getUrl(endpoint, queryParameters) {
    const boundUri = OutputEndpointData.getUrlWithBoundParameters(endpoint.uri, endpoint.urlParameters);
    return boundUri + (Object.keys(queryParameters).length ? `?` + qs.stringify(queryParameters) : '');
}
async function makeSureAppIsRunning(responseCallRules) {
    // Using a single global app process here to avoid premature kills
    if (!appProcess && !await isPortTaken(url.parse(responseCallRules.baseUrl).port)) {
        try {
            tools.info(`Starting your app (\`${responseCallRules.serverStartCommand}\`) for response calls...`);
            const [command, ...args] = responseCallRules.serverStartCommand.split(" ");
            appProcess = spawn(command, args, { stdio: 'ignore', cwd: process.cwd() });
            return new Promise(resolve => {
                // Delay for 2s to give the app time to start
                setTimeout(resolve, 2000);
            });
        }
        catch (e) {
            tools.warn(`Couldn't start your app, so response calls may not work; if it's already running, you can ignore this message.`);
            // do nothing; app is probably running already
        }
    }
}
async function makeResponseCall(responseCallRules, endpoint) {
    configureEnvironment(responseCallRules);
    setAuthFieldProperly(endpoint);
    const bodyParameters = Object.assign({}, endpoint.cleanBodyParameters || {}, responseCallRules.bodyParams || {});
    const queryParameters = Object.assign({}, endpoint.cleanQueryParameters || {}, responseCallRules.queryParams || {});
    const fileParameters = Object.assign({}, endpoint.fileParameters || {}, responseCallRules.fileParams || {});
    await makeSureAppIsRunning(responseCallRules);
    tools.debug("Fetching response from " + endpoint.httpMethods[0] + " " + endpoint.uri);
    const http = require('http');
    let responseContent;
    const requestOptions = {
        method: endpoint.httpMethods[0],
        headers: Object.assign({ 'user-agent': 'curl/7.22.0' }, endpoint.headers),
        path: getUrl(endpoint, queryParameters),
    };
    const promise = new Promise((resolve, reject) => {
        const req = http.request(responseCallRules.baseUrl, requestOptions, (res) => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            const returnResponse = () => {
                responseContent = prettyPrintResponseIfJson(data);
                resolve({
                    status: Number(res.statusCode),
                    description: '',
                    headers: res.headers,
                    content: responseContent
                });
            };
            res.on('end', returnResponse);
            // In case of a premature connection close after the response is received
            res.on("aborted", returnResponse);
        })
            .on("error", (err) => {
            reject(err);
        })
            .setTimeout(7000, () => {
            req.end();
            reject(new Error("Request timed out"));
        });
        if (Object.keys(fileParameters).length) {
            const FormData = require('form-data');
            const form = new FormData();
            for (let [name, value] of Object.entries(fileParameters)) {
                while (Array.isArray(value)) { // For arrays of files, just send the first one
                    name += '[]';
                    value = value[0];
                }
                if (typeof value === 'string') {
                    // The user may have passed in an actual file path
                    if (!fs.existsSync(value)) { // abs path
                        if (fs.existsSync(path.resolve(value))) { // relative path
                            value = path.resolve(value);
                        }
                        else {
                            value = (new TestingFile).___filePath;
                        }
                    }
                }
                else {
                    value = (new TestingFile).___filePath;
                }
                const readStream = fs.createReadStream(value);
                form.append(name, readStream);
            }
            for (let [name, value] of Object.entries(bodyParameters)) {
                form.append(name, value);
            }
            // Add the Content-type header
            req.setHeader('content-type', form.getHeaders()['content-type']);
            form.pipe(req);
        }
        else if (Object.keys(bodyParameters).length) {
            req.end(JSON.stringify(bodyParameters));
        }
        else {
            req.end();
        }
    });
    return promise.then(response => {
        return [response];
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
    const [where, name, value] = endpoint.auth;
    endpoint[where][name] = value;
    return;
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=response_call.js.map