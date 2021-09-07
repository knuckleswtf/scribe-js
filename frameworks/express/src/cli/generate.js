'use strict';

const path = require("path");
const trim = require('lodash.trim');

const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = async ({config, app, server, force = false, extraction = true, verbose = false}) => {
    tools.setVerbosity(verbose);

    // An object is also allowed, for easier testing
    let configObject = tools.checkConfigFile(config);
    if (!configObject) {
        tools.warn(`Config file not found. Initialising with a default config file...`);
        console.log();
        await require('./init')();
        return;
    }

    const appFile = path.resolve(app);
    const serverStartCommand = server ? `node ${path.resolve(server)}` : tools.findServerStartCommand();


    if (!extraction) {
        const {generate} = require('@knuckleswtf/scribe');
        await generate(null, configObject, 'express', null, {
            noExtraction: true,
            verbose,
        });
        return;
    }

    process.env.SCRIBE_GENERATE = "1";

    const decorator = require("../decorator");
    decorator();

    require(appFile);

    configObject.strategies = configObject.strategies || {};
    configObject.strategies.urlParameters = [
        // Important to prepend it so docblock strategies can override this
        path.join(__dirname, '../strategies/url_parameters/express_route_api'),
        ...configObject.strategies.urlParameters || []
    ];

    const endpoints = getRoutesFromOurDecorator(decorator);

    const {generate} = require('@knuckleswtf/scribe');
    await generate(endpoints, configObject, 'express', serverStartCommand, {force, verbose});

    // Make sure to end process, in case server is still running
    if (process.env.SCRIBE_TEST !== '1') {
        process.exit(0);
    }
}

function getRoutesFromOurDecorator(decorator) {
    // At this point, there should be only one router (the main router)
    let [allRoutes] = [...decorator.subRouters.values()];

    // Clean up routes
    allRoutes = allRoutes.map(r => {
        r.uri = '/' + trim(r.uri, '/');
        return r;
    })

    // Reset (useful for tests)
    decorator.subRouters = new Map;

    return allRoutes;
}