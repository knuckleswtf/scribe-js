'use strict';

const fs = require("fs");
const path = require("path");
const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = async ({config, server, force = false, extraction = true, verbose = false}) => {
    tools.setVerbosity(verbose);

    const configFile = path.resolve(config);
    const serverFile = path.resolve(server);

    if (!fs.existsSync(configFile)) {
        tools.warn(`Config file ${configFile} does not exist. Initialising with a default config file...`);
        console.log();
        await require('./init')();
        return;
    }

    if (!extraction) {
        const configObject = require(configFile);

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

    require(serverFile);

    const configObject = require(configFile);
    configObject.strategies = configObject.strategies || {};
    configObject.strategies.urlParameters =
        // Important to prepend it so docblock strategies can override this
        [path.join(__dirname, '../strategies/url_parameters/restify_route_api')].concat(
            configObject.strategies.urlParameters || []
        );

    const routes = decorator.allRoutes;
    const {generate} = require('@knuckleswtf/scribe');
    await generate(routes, configObject, 'restify', null, {force, verbose});

    // Make sure to end process, in case server is still running
    setTimeout(() => process.exit(0), 1300);
}
