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
        'The file where you create your Express application. This file should export your app/router object.',
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
    .description("Generate API documentation from your Node.js codebase.")
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

        const configObject: scribe.Config = require(configFile);

        const appObject = require(appFile);

        if (!appObject._router) {
            console.error("Couldn't find an export from your app file. Did you remember to export your `app` object?");
            process.exit(1);
        }

        if (!appObject._decoratedByScribe) {
            console.error("Something's not right. Did you remember to add `require('@knuckleswtf/scribe')(app)` before registering your Express routes?");
            process.exit(1);
        }

        const endpoints = require('./get_routes.js')(appObject);

        const {generate} = require('@knuckleswtf/scribe');
        await generate(endpoints, configObject, 'express', serverFile, force);
    });


program
    .command('init')
    .description("Create config file with default options.")
    .action(createConfigFile);

program.parse(process.argv);

async function createConfigFile() {
    const fileName = '.scribe.config.js';
    const config = require('@knuckleswtf/scribe/config.js');

    console.log(`Hi! We'll ask a few questions to help set up your config file. All questions are optional and you can set the values yourself later.`);
    console.log('Hit Enter to skip a question.');
    console.log();

    const inquirer = require('inquirer');

    const inferredApiName = path.basename(path.resolve('./')).split(/[-_\s]+/)
        .map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

    // Basically ucwords (folderName)
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
                default: config.baseUrl,
            },
            {
                type: 'input',
                name: 'localPort',
                message: "What port do you run your API on in localhost? :",
                default: "3000",
            },
        ]);
    console.log("Cool, thanks!");
    console.log();

    const tools = require("@knuckleswtf/scribe/dist/tools");
    tools.generateConfigFile(path.resolve(fileName), {
        name: responses.name,
        baseUrl: responses.baseUrl,
        localPort: responses.localPort
    });

    console.log(`Take a moment to check it out, and then run \`generate\` when you're ready.`);
}