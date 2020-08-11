import {scribe} from "../../../typedefs/core";
import fs = require("fs");
import path = require("path");
import * as qs from "querystring";

function shouldMakeResponseCall(config: scribe.Config, endpoint: scribe.Endpoint, routeGroup: typeof config.routes[0]) {
    // If there's already a success response, don't make a response call
    if (endpoint.responses.find(r => r.status >= 200 && r.status <= 300)) {
        return false;
    }

    const allowedMethods = routeGroup.apply.responseCalls.methods;
    // @ts-ignore
    if (allowedMethods.includes('*') || allowedMethods.includes(Object.keys(endpoint.methods)[0].toUpperCase())) {
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

    // todo file params

    console.log("Hitting " + endpoint.uri);

    const http = require('http');
    let responseContent: string;

    const promise = new Promise<scribe.Response>((resolve, reject) => {
        const req = http.request(responseCallRules.baseUrl,
            {
                method: Object.keys(endpoint.methods)[0],
                headers: endpoint.headers,
                path: endpoint.boundUri + (queryParameters ? `?` + qs.stringify(queryParameters) : ''),
            },
            (resp) => {
                let data = '';

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {
                    responseContent = data;
                    resolve({
                        status: resp.statusCode,
                        content: responseContent
                    });
                });

            }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err);
        });

        if (bodyParameters) {
            req.write(JSON.stringify(bodyParameters));
        }
        req.end();
    });

    return promise.then(response => {
        return [response];
    }).catch((err) => {
        console.log(err);
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

function setAuthFieldProperly(endpoint: scribe.Endpoint): void
{
    if (!endpoint.auth) {
        return;
    }

    const [where, name, value] = endpoint.auth.split('.', 3);
    endpoint[where][name] = value;

    return;
}