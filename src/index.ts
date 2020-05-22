const matcher = require('matcher');

const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';
const config = require('../config.js');

const app = require(fileName);

config.routes.forEach((routeGroup) => {
    const getRoutes = require(`./get_routes/${config.router}`);
    const extractResponses = require('./extract_info/responses/express');

    const routes = getRoutes(app);

    const endpointsToDocument = routes.filter(r => {
        return matcher.isMatch(r.fullPath, routeGroup.paths);
    });

    (async () => {
        endpointsToDocument.forEach(async endpoint => {
            console.log(await extractResponses(endpoint, fileName, config));
        });
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

