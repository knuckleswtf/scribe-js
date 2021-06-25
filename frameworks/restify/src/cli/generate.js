'use strict';

const fs = require("fs");
const path = require("path");
const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = async ({config, server, force = false, extraction = true, verbose = false}) => {
    if (verbose) {
        // Needed to do this since enable() clears all previously enabled
        const namespacesToEnable = process.env.DEBUG ? (process.env.DEBUG + ',lib:scribe*') : 'lib:scribe*';
        require('debug').enable(namespacesToEnable);
    }

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

        const {generate} = require('dist');
        await generate(null, configObject, 'restify', null, {
            noExtraction: !extraction,
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
    await generate(routes, configObject, 'restify', null, {force});

    // Make sure to end process, in case server is still running
    setTimeout(() => process.exit(0), 1300);
}
