import {express} from "../../../typedefs/express";
import {endpoint} from "../../../typedefs/core";


async function getRouteResponse(endpoint: endpoint.Endpoint, config): Promise<endpoint.Response[]> {
    console.log("Hitting " + endpoint.uri);

    const http = require('http');
    let responseContent: string;
    const promise = new Promise<endpoint.Response>((resolve, reject) => {
        const req = http.request(config.baseUrl + endpoint.uri,
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
                    status: resp.status,
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

export = (endpoint: endpoint.Endpoint, config) => {
    return getRouteResponse(endpoint, config);
};