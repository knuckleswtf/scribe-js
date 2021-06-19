'use strict';

const fs = require("fs");
const path = require("path");

const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = async ({config, app, server, force, extraction, verbose}) => {
    if (verbose) {
        // Needed to do this since enable() clears all previously enabled
        const namespacesToEnable = process.env.DEBUG ? (process.env.DEBUG + ',lib:scribe*') : 'lib:scribe*';
        require('debug').enable(namespacesToEnable);
    }

    const configFile = path.resolve(config);
    const appFile = path.resolve(app);
    const serverStartCommand = server ? `node ${path.resolve(server)}` : tools.findServerStartCommand();

    if (!fs.existsSync(configFile)) {
        tools.warn(`Config file ${configFile} does not exist. Initialising with a default config file...`);
        console.log();
        await require('./init')();
        return;
    }

    if (!extraction) {
        const configObject = require(configFile);

        const {generate} = require('@knuckleswtf/scribe');
        await generate(null, configObject, 'express', null, {
            noExtraction: !extraction,
        });
        return;
    }

    process.env.SCRIBE_GENERATE = "1";

    const decorator = require("../decorator");
    decorator();

    require(appFile);

    const configObject = require(configFile);
    configObject.strategies = configObject.strategies || {};
    configObject.strategies.urlParameters =
        (configObject.strategies.urlParameters || []).concat(
            path.join(__dirname, '../strategies/url_parameters/express_route_api')
        );

    const endpoints = getRoutesFromOurDecorator(decorator);

    const {generate} = require('@knuckleswtf/scribe');
    await generate(endpoints, configObject, 'express', serverStartCommand, {overwriteMarkdownFiles: force});

    // Make sure to end process, in case server is still running
    // Wrapping in a timeout because it seems sometimes ncp/pastel fails to copy over all assets in time
    setTimeout(() => process.exit(0), 1300);
}

function getRoutesFromOurDecorator(decorator) {
    // At this point, there should be only one router (the main router)
    // and one app (routes added via sub-routers or sub-apps)
    let allRoutes = [...decorator.subRouters.values()].concat([...decorator.subApps.values()]).flat(1);

    return allRoutes;
}