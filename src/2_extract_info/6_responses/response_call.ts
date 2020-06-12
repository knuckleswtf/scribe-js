import {scribe} from "../../../typedefs/core";


async function run(endpoint: scribe.Endpoint, config): Promise<scribe.Response[]> {
    console.log("Hitting " + endpoint.uri);

    const http = require('http');
    let responseContent: string;
    const promise = new Promise<scribe.Response>((resolve, reject) => {
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