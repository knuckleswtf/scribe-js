import {express} from "../../../typedefs/express";

const spawn = require('cross-spawn');


function getRouteResponse(route: {route: express.Route, fullPath: string}, mainFilePath: string) {
    spawn('node', [mainFilePath], { stdio: 'inherit' });
    const http = require('http');
    let fullResponse;

    console.log("Hitting " + route.fullPath);

    const promise = new Promise((resolve, reject) => {
        const req = http.request('http://localhost:8800' + route.fullPath,
            {
                method: Object.keys(route.route.methods)[0],
            },
            (resp) => {
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

    return promise.then(response => ({fullPath: route.fullPath, response}));
}

export = (route, mainFilePath) => {
    return getRouteResponse(route, mainFilePath);
};