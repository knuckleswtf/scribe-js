#!/usr/bin/env node
import fs = require("fs");
import path = require("path");
import program = require('commander');

import {scribe} from "../../../typedefs/core";

const log = require('debug')('lib:scribe:express');
const VERSION = require('../package.json').version;

program
    .name('Scribe')
    .version(VERSION)
    .command('generate')
    .option(
        '-c, --config <file>',
        'Scribe config file',
        '.scribe.config.js'
    )
    .option(
        '-a, --app <file>',
        'The file where you create your Express application. Make sure it exports your app/router object.',
        'index.js',
    )
    .option(
        '-s, --server <file>',
        'Server file of your API. This is the file that is executed by Node to start your server. ' +
        'You can omit this if your app file also starts your server.',
    )
    .option(
        '-f, --force',
        "Discard any changes you've made to the source Markdown files",
        false,
    )
    .description("Generate API documentation from your Express routes.")
    .action(async ({config, app, server, force}) => {
        const configFile = path.resolve(config);
        const appFile = path.resolve(app);
        const serverFile = server ? path.resolve(server) : null;

        if (!fs.existsSync(configFile)) {
            console.log(`⚠ Config file ${configFile} does not exist. Initialising with a default config file...`);
            console.log();
            await createConfigFile();
            return;
        }

        const appObject = require(appFile);

        if (!appObject._router) {
            console.error("Couldn't find an export from your app file. Did you remember to export your `app` object?");
            process.exit(1);
        }

        if (!appObject._decoratedByScribe) {
            console.error("Something's not right. Did you remember to add `require('@knuckleswtf/scribe-express')(app)` before registering your Express routes?");
            process.exit(1);
        }

        const configObject: scribe.Config = require(configFile);
        // @ts-ignore
        configObject.strategies = configObject.strategies || {};
        configObject.strategies.urlParameters = (configObject.strategies.urlParameters || []).concat(path.join(__dirname, './strategies/url_parameters/express_route_api'));

        const endpoints = require('./get_routes.js')(appObject);

        const {generate} = require('@knuckleswtf/scribe');
        await generate(endpoints, configObject, 'express', serverFile, force);

        // Make sure to end process, in case server is still running
        // Wrapping in a timeout because it seems sometimes ncp/pastel fails to copy over all assets in time
        setTimeout(() => process.exit(0), 2200);
    });


program
    .command('init')
    .description("Initialise a config file in the root of your project.")
    .action(createConfigFile);

program.parse(process.argv);

async function createConfigFile() {
    const fileName = '.scribe.config.js';

    const tools = require("@knuckleswtf/scribe/dist/tools");
    tools.info(`Hi! We'll ask a few questions to help set up your config file. All questions are optional and you can set the values yourself later.`);
    tools.info('Hit Enter to skip a question.');
    console.log();

    const inquirer = require('inquirer');

    const inferredApiName = tools.inferApiName();

    const responses = await inquirer
        .prompt([
            {
                type: 'input',
                name: 'name',
                message: "What's the name of your API? :",
                default: inferredApiName,
            },
            {
                type: 'input',
                name: 'baseUrl',
                message: "What base URL do you want to show up in your API docs? :",
                default: 'http://yourApi.dev',
            },
            {
                type: 'input',
                name: 'localPort',
                message: "What port do you run your API on in localhost? :",
                default: process.env.PORT || 3000,
            },
        ]);
    tools.info("Cool, thanks!");
    console.log();

    tools.generateConfigFile(path.resolve(fileName), {
        name: responses.name,
        baseUrl: responses.baseUrl,
        localPort: responses.localPort
    });

    tools.info(`Take a moment to check it out, and then run \`generate\` when you're ready.`);
}