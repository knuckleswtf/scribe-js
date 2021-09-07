'use strict';

const path = require("path");
const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = async ({config, server, force = false, extraction = true, verbose = false}) => {
    tools.setVerbosity(verbose);

    // An object is also allowed, for easier testing
    let configObject = tools.checkConfigFile(config);
    if (!configObject) {
        tools.warn(`Config file not found. Initialising with a default config file...`);
        console.log();
        await require('./init')();
        return;
    }

    if (!extraction) {
        const {generate} = require('@knuckleswtf/scribe');
        await generate(null, configObject, 'restify', null, {
            noExtraction: true,
            verbose,
        });
        return;
    }

    process.env.SCRIBE_GENERATE = "1";

    const decorator = require("../../src/decorator");
    decorator();

    const serverFile = path.resolve(server);
    require(serverFile);

    configObject.strategies = configObject.strategies || {};
    configObject.strategies.urlParameters = [
        // Important to prepend it so docblock strategies can override this
        path.join(__dirname, '../strategies/url_parameters/restify_route_api'),
        ...configObject.strategies.urlParameters || []
    ];

    const routes = decorator.allRoutes;
    // Reset (useful for tests)
    decorator.allRoutes = [];
    const {generate} = require('@knuckleswtf/scribe');
    await generate(routes, configObject, 'restify', null, {force, verbose, noExtraction: false});

    // Make sure to end process (except when testing), in case server is still running
    if (process.env.SCRIBE_TEST !== '1') {
        process.exit(0);
    }
}
