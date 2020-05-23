"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const matcher = require('matcher');
const utils = require("./utils");
const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';
const config = require('../config.js');
const app = require(fileName);
config.routes.forEach((routeGroup) => {
    const getEndpoints = require(`./get_endpoints/${config.router}`);
    const endpoints = getEndpoints(app);
    let endpointsToDocument = endpoints.filter(e => {
        if (routeGroup.exclude.length) {
            const shouldExclude = matcher.isMatch(e.uri, routeGroup.exclude);
            if (shouldExclude)
                return false;
        }
        return matcher.isMatch(e.uri, routeGroup.include);
    });
    const extractMetadata = require(`./extract_info/metadata/${config.router}`);
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        endpoint.metadata = extractMetadata(endpoint, config);
        return endpoint;
    });
    const extractUrlParameters = require(`./extract_info/url_parameters/${config.router}`);
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        endpoint.urlParameters = extractUrlParameters(endpoint, config);
        return endpoint;
    });
    const extractBodyParameters = require(`./extract_info/body_parameters/${config.router}`);
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        endpoint.bodyParameters = extractBodyParameters(endpoint, config);
        return endpoint;
    });
    const extractResponses = require(`./extract_info/responses/${config.router}`);
    (async () => {
        // Using a single global app process here to avoid premature kills
        let appProcess;
        const url = new URL(config.baseUrl);
        if (!(await utils.isPortTaken(url.port))) {
            appProcess = child_process_1.spawn('node', [fileName], { stdio: 'inherit' });
        }
        await Promise.all(endpointsToDocument.map(async (endpoint) => {
            endpoint.responses = await extractResponses(endpoint, config, fileName);
            delete endpoint.route;
        })).catch(err => {
            appProcess && appProcess.kill();
            console.log(err);
        });
        appProcess && appProcess.kill();
        console.log(endpointsToDocument);
        /*
                const Handlebars = require("handlebars");
                const helpers = require('handlebars-helpers')();
                const fs = require('fs');
                Handlebars.registerPartial('components.badges.auth', fs.readFileSync(require('path').resolve(__dirname, '../views/components/badges/auth.hbs'), 'utf8'));
                Handlebars.registerHelper('defaultValue', function (value, defaultValue) {
                    const out = value || defaultValue;
                    return new Handlebars.SafeString(out);
                });
                Handlebars.registerHelper('httpMethodToCssColour', function (method: string) {
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
                    const markdown = template({route: e});
                    e.output = markdown;
                    console.log(markdown);
                    return e;
                });*/
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