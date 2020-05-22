"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const matcher = require('matcher');
const utils = require("./utils");
const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';
const config = require('../config.js');
const app = require(fileName);
config.routes.forEach((routeGroup) => {
    const getRoutes = require(`./get_routes/${config.router}`);
    const routes = getRoutes(app);
    let endpointsToDocument = routes.filter(r => {
        return matcher.isMatch(r.fullPath, routeGroup.paths);
    });
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        endpoint.metadata = {};
        endpoint.uri = endpoint.fullPath;
        endpoint.methods = Object.keys(endpoint.route.methods);
        endpoint.showResponse = true;
        return endpoint;
    });
    const extractUrlParameters = require('./extract_info/url_parameters/express');
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        const params = extractUrlParameters(endpoint);
        endpoint.urlParameters = params;
        return endpoint;
    });
    const extractBodyParameters = require('./extract_info/body_parameters/express');
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        const params = extractBodyParameters(endpoint);
        endpoint.bodyParameters = params;
        return endpoint;
    });
    const extractResponses = require('./extract_info/responses/express');
    (async () => {
        // Using a single global app process here to avoid premature kills
        let appProcess;
        const url = new URL(config.baseUrl);
        if (!(await utils.isPortTaken(url.port))) {
            appProcess = child_process_1.spawn('node', [fileName], { stdio: 'inherit' });
        }
        await Promise.all(endpointsToDocument.map(async (endpoint) => {
            endpoint.response = await extractResponses(endpoint, fileName, config);
            delete endpoint.route;
        })).catch(err => {
            console.log(err);
            appProcess && appProcess.kill();
        });
        appProcess && appProcess.kill();
        console.log(endpointsToDocument);
        const Handlebars = require("handlebars");
        const fs = require('fs');
        Handlebars.registerPartial('components.badges.auth', fs.readFileSync(require('path').resolve(__dirname, '../views/components/badges/auth.hbs'), 'utf8'));
        Handlebars.registerHelper('defaultValue', function (value, defaultValue) {
            const out = value || defaultValue;
            return new Handlebars.SafeString(out);
        });
        Handlebars.registerHelper('httpMethodToCssColour', function (method) {
            const colours = {
                GET: 'green',
                HEAD: 'darkgreen',
                POST: 'black',
                PUT: 'darkblue',
                PATCH: 'purple',
                DELETE: 'red',
            };
            return new Handlebars.SafeString(colours[method.toUpperCase()]);
        });
        endpointsToDocument = endpointsToDocument.map((e) => {
            const template = Handlebars.compile(fs.readFileSync(require('path').resolve(__dirname, '../views/partials/endpoint.hbs'), 'utf8'));
            const markdown = template({ route: e });
            e.output = markdown;
            console.log(markdown);
            return e;
        });
        /*
        const template = Handlebars.compile();
        const markdown = template({settings: config, endpoints: endpointsToDocument});

        fs.writeFileSync('index.md', markdown);*/
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
//# sourceMappingURL=index.js.map