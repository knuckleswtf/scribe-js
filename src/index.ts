import {spawn} from "child_process";
import {endpoint} from "../typedefs/core";

const matcher = require('matcher');
import utils = require('./utils');

import html = require("./output/html");

const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';
const config = require('../config.js');

const app = require(fileName);

config.routes.forEach((routeGroup) => {
    const getEndpoints = require(`./get_endpoints/${config.router}`);

    const endpoints: endpoint.Endpoint[] = getEndpoints(app);

    let endpointsToDocument = endpoints.filter(e => {
        if (routeGroup.exclude.length) {
            const shouldExclude = matcher.isMatch(e.uri, routeGroup.exclude);
            if (shouldExclude) return false;
        }

        return matcher.isMatch(e.uri, routeGroup.include);
    });

    const extractMetadata = require(`./extract_info/metadata/${config.router}`);
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        endpoint.metadata = extractMetadata(endpoint, config) as endpoint.Metadata;
        return endpoint;
    });

    const extractUrlParameters = require(`./extract_info/url_parameters/${config.router}`);
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        endpoint.urlParameters = extractUrlParameters(endpoint, config) as endpoint.UrlParameter[];
        endpoint.boundUri = endpoint.urlParameters.reduce((uri, p) => {
            return uri.replace(new RegExp(`:?${p.name}[^\W]+`), p.value);
        }, endpoint.uri);
        endpoint.uri = endpoint.uri.replace(/\(.+\)/, '');
        return endpoint;
    });

    const extractBodyParameters = require(`./extract_info/body_parameters/${config.router}`);
    endpointsToDocument = endpointsToDocument.map(endpoint => {
        endpoint.bodyParameters = extractBodyParameters(endpoint, config) as endpoint.BodyParameter[];
        return endpoint;
    });

    const extractResponses = require(`./extract_info/responses/${config.router}`);
    (async () => {
        // Using a single global app process here to avoid premature kills
        let appProcess;

        const url = new URL(config.baseUrl);
        if (!(await utils.isPortTaken(url.port))) {
            appProcess = spawn('node', [fileName], { stdio: 'inherit' });
        }

        await Promise.all(endpointsToDocument.map(async endpoint => {
            endpoint.responses = await extractResponses(endpoint, config, fileName);
            delete endpoint.route;
        })).catch(err => {
            appProcess && appProcess.kill();
            console.log(err);
        });

        appProcess && appProcess.kill();

        html.writeIndexMarkdownFile(config);
        html.writeAuthMarkdownFile(config);
        html.writeGroupMarkdownFiles(endpointsToDocument, config);

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

