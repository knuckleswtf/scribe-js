import {scribe} from "../../../typedefs/core";
import fs = require("fs");
import path = require("path");
import * as qs from "querystring";
const debug = require('debug')('lib:scribe:responsecall');
const tools = require('./../../tools');

function shouldMakeResponseCall(config: scribe.Config, endpoint: scribe.Endpoint, routeGroup: typeof config.routes[0]) {
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

async function run(endpoint: scribe.Endpoint, config: scribe.Config, routeGroup: typeof config.routes[0]): Promise<scribe.Response[]> {
    if (!shouldMakeResponseCall(config, endpoint, routeGroup)) {
        return [];
    }
    return makeResponseCall(routeGroup.apply.responseCalls, endpoint);
}

export = {
    routers: [],
    run
};

function makeResponseCall(responseCallRules: scribe.ResponseCallRules, endpoint: scribe.Endpoint) {
    configureEnvironment(responseCallRules);

    setAuthFieldProperly(endpoint);

    const bodyParameters = Object.assign({}, endpoint.cleanBodyParameters || {}, responseCallRules.bodyParams || {});
    const queryParameters = Object.assign({}, endpoint.cleanQueryParameters || {}, responseCallRules.queryParams || {});
    const fileParameters = Object.assign({}, endpoint.fileParameters || {}, responseCallRules.fileParams || {});


    debug("Hitting " + endpoint.methods[0] + " " + endpoint.uri);

    const http = require('http');
    let responseContent: string;

    const requestOptions = {
        method: endpoint.methods[0],
        headers: Object.assign({'user-agent': 'curl/7.22.0'}, endpoint.headers),
        path: endpoint.boundUri + (Object.keys(queryParameters).length ? `?` + qs.stringify(queryParameters) : ''),
    };
    const promise = new Promise<scribe.Response>((resolve, reject) => {
        const req = http.request(responseCallRules.baseUrl,
            requestOptions,
            (res) => {
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
            .on("timeout", () => {
                reject(new Error("Request timed out"));
            })
            .setTimeout(3000);

        if (Object.keys(fileParameters).length) {
            const FormData = require('form-data');
            const form = new FormData();
            const tmp = require('tmp-promise');
            for (let [name, value] of Object.entries(fileParameters)) {
                if (!fs.existsSync(value) || fs.existsSync(path.resolve(value))) { // The user may have passed ni an actual file path
                    const tempFile = tmp.fileSync();
                    value = tempFile.name;
                }
                const readStream = fs.createReadStream(value);
                form.append(name, readStream);
            }
            for (let [name, value] of Object.entries(fileParameters)) {
                form.append(name, value);
            }
            form.pipe(req);
        } else if (Object.keys(bodyParameters).length) {
            req.write(JSON.stringify(bodyParameters));
            req.end();
        }
    });

    return promise.then(response => {
        return [response];
    }).catch((err) => {
        tools.warn("Error encountered during response call.");
        tools.dumpExceptionIfVerbose(err);
        return [];
    });
}

function configureEnvironment(responseCallRules: scribe.ResponseCallRules) {
    const docsEnvFile = path.resolve(".env.docs");
    if (fs.existsSync(docsEnvFile)) {
        require('dotenv').config({path: docsEnvFile});
    }

    if (responseCallRules.env) {
        for (let [key, value] of Object.entries(responseCallRules.env)) {
            process.env[key] = value;
        }
    }
}

function setAuthFieldProperly(endpoint: scribe.Endpoint): void {
    if (!endpoint.auth) {
        return;
    }

    const [where, name, value] = endpoint.auth.split('.', 3);
    endpoint[where][name] = value;

    return;
}