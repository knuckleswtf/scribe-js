"use strict";
async function getRouteResponse(endpoint, config) {
    console.log("Hitting " + endpoint.uri);
    const http = require('http');
    let responseContent;
    const promise = new Promise((resolve, reject) => {
        const req = http.request(config.baseUrl + endpoint.uri, {
            method: Object.keys(endpoint.route.methods)[0],
        }, (resp) => {
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
module.exports = (endpoint, config) => {
    return getRouteResponse(endpoint, config);
};
//# sourceMappingURL=express.js.map