import {scribe} from "../../../typedefs/core";
import fs = require("fs");
import path = require("path");



function shouldMakeResponseCall(config: scribe.Config, endpoint: scribe.Endpoint, routeGroup: typeof config.routes[0]) {
    // If there's already a success response, don't make a response call
    if (endpoint.responses.find(r => r.status >= 200 && r.status <= 300)) {
        return false;
    }

    const allowedMethods = routeGroup.apply.responseCalls.methods;
    // @ts-ignore
    if (allowedMethods.includes('*') || allowedMethods.includes(Object.keys(endpoint.route.methods)[0].toUpperCase())) {
        return true;
    }

    return false;
}

async function run(endpoint: scribe.Endpoint, config: scribe.Config, routeGroup: typeof config.routes[0]): Promise<scribe.Response[]> {
    if (!shouldMakeResponseCall(config, endpoint, routeGroup)) {
        return [];
    }

    const docsEnvFile = path.resolve(".env.docs");
    if (fs.existsSync(docsEnvFile)) {
        require('dotenv').config({path: docsEnvFile});
    }

    if (routeGroup.apply.responseCalls.env) {
        for (let [key, value] of Object.entries(routeGroup.apply.responseCalls.env)) {
            process.env[key] = value;
        }
    }

    console.log("Hitting " + endpoint.uri);

    const http = require('http');
    let responseContent: string;
    const promise = new Promise<scribe.Response>((resolve, reject) => {
        const req = http.request(routeGroup.apply.responseCalls.baseUrl.replace(/\/$/, '') + endpoint.uri,
            {
                method: Object.keys(endpoint.route.methods)[0],
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

        req.end();
    });

    return promise.then(response => {
        return [response];
    }).catch((err) => {
        console.log(err);
        return [];
    });
}

export = {
    routers: [],
    run
};