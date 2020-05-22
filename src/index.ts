import {spawn} from "child_process";

const matcher = require('matcher');
import utils = require('./utils');

const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';
const config = require('../config.js');

const app = require(fileName);

config.routes.forEach((routeGroup) => {
    const getRoutes = require(`./get_routes/${config.router}`);

    const routes = getRoutes(app);

    let endpointsToDocument = routes.filter(r => {
        return matcher.isMatch(r.fullPath, routeGroup.paths);
    });

    const extractUrlParameters = require('./extract_info/url_parameters/express');
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        const params = extractUrlParameters(endpoint);
        console.log(params);
        endpoint.urlParameters = params;
        return endpoint;
    });

    const extractResponses = require('./extract_info/responses/express');
    (async () => {
        // Using a single global app process here to avoid premature kills
/*        let appProcess;

        const url = new URL(config.baseUrl);
        if (!(await utils.isPortTaken(url.port))) {
            appProcess = spawn('node', [fileName], { stdio: 'inherit' });
        }

        await Promise.all(endpointsToDocument.map(async endpoint => {
            console.log(await extractResponses(endpoint, fileName, config));
        })).catch(err => {
            console.log(err);
            appProcess && appProcess.kill();
        });

        appProcess && appProcess.kill();*/
    })();
});

// Possible (Express, exported app):
// 1. get endpoint
// 2. get url of endpoint
// 3. response calls
// 4. URL Parameters
// 5. Query/body - Scan code for req.body.X, { X } = req.body
// NB - handle sub-apps

// Potential (framework-specific)
// 1. Parameter names and types (from validation)

