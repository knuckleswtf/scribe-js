#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const program = require("commander");
const EventEmitter = require("events").EventEmitter;
const log = require('debug')('lib:scribe:restify');
const VERSION = require('../package.json').version;
program
    .name('Scribe')
    .version(VERSION)
    .command('generate')
    .option('-c, --config <file>', 'Scribe config file', '.scribe.config.js')
    .option('-s, --server <file>', 'The file where you set up and start your Restify server. Make sure it exports your server object.', 'index.js')
    .option('-f, --force', "Discard any changes you've made to the source Markdown files", false)
    .description("Generate API documentation from your Restify routes.")
    .action(async ({ config, server, force }) => {
    const configFile = path.resolve(config);
    const serverFile = path.resolve(server);
    if (!fs.existsSync(configFile)) {
        console.log(`⚠ Config file ${configFile} does not exist. Initialising with a default config file...`);
        console.log();
        await createConfigFile();
        return;
    }
    const configObject = require(configFile);
    let serverObject = require(serverFile);
    if (!(serverObject instanceof EventEmitter)) {
        console.error("Couldn't find an export from your server file. Did you remember to export your `server` object?");
        process.exit(1);
    }
    if (!serverObject._decoratedByScribe) {
        console.error("Something's not right. Did you remember to add `require('@knuckleswtf/scribe-restify')(server)` before registering your Restify routes?");
        process.exit(1);
    }
    const endpoints = require('./get_routes')(serverObject);
    const { generate } = require('@knuckleswtf/scribe');
    await generate(endpoints, configObject, 'restify', null, force);
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
//# sourceMappingURL=cli.js.map