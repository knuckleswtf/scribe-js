"use strict";
async function getRouteResponse(route, mainFilePath, config) {
    console.log("Hitting " + route.fullPath);
    const http = require('http');
    let fullResponse;
    const promise = new Promise((resolve, reject) => {
        const req = http.request(config.baseUrl + route.fullPath, {
            method: Object.keys(route.route.methods)[0],
        }, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                fullResponse = data;
                resolve(fullResponse);
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err);
        });
        req.end();
    });
    return promise.then(response => {
        return { fullPath: route.fullPath, response };
    }).catch((err) => {
        console.log(err);
    });
}
module.exports = (route, mainFilePath, config) => {
    return getRouteResponse(route, mainFilePath, config);
};
//# sourceMappingURL=express.js.map