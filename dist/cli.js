#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const VERSION = require('../package.json').version;
const program = require("commander");
program
    .name('Scribe')
    .version(VERSION)
    .command('generate')
    .option('-c, --config <file>', 'Scribe config file', '.scribe.config.js')
    .option('-a, --app <file>', 'The file where you create your application (Express/). This file should export your app/router object.', 'index.js')
    .option('-s, --server <file>', 'Server file of your API. This is the file that is executed by Node to start your server. ' +
    'You can omit this if your app file also starts your server.')
    .description("Generate API documentation from your Node.js codebase.")
    .action(async ({ config, app, server }) => {
    const configFile = path.resolve(config);
    const appFile = path.resolve(app);
    const serverFile = server ? path.resolve(server) : null;
    if (!fs.existsSync(configFile)) {
        console.log(`⚠ Config file ${configFile} does not exist. Initialising with a default config file...`);
        console.log();
        await createConfigFile();
        return;
    }
    const generate = require('./index');
    await generate(configFile, appFile, serverFile);
});
program
    .command('init')
    .description("Create config file with default options.")
    .action(createConfigFile);
program.parse(process.argv);
async function createConfigFile() {
    const fileName = '.scribe.config.js';
    const config = require('../config.js');
    console.log(`Hi! We'll ask a few questions to help set up your config file. All questions are optional and you can set the values yourself later.`);
    console.log('Hit Enter to skip a question.');
    console.log();
    const inquirer = require('inquirer');
    // Basically ucwords (folderName)
    const inferredName = path.basename(path.resolve('./')).split(/[-_\s]+/)
        .map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
    try {
        const responses = await inquirer
            .prompt([
            {
                type: 'input',
                name: 'title',
                message: "What's the name of your API? :",
                default: inferredName,
            },
            {
                type: 'input',
                name: 'baseUrl',
                message: "What base URL do you want to show up in your API docs? :",
                default: config.baseUrl,
            },
            {
                type: 'input',
                name: 'responseCallBaseUrl',
                message: "What base URL are you running your API on locally? :",
                default: config.routes[0].apply.responseCalls.baseUrl,
            },
        ]);
        console.log("Cool, thanks!");
        console.log();
        config.title = responses.title + ' Documentation';
        config.baseUrl = responses.baseUrl;
        config.routes[0].apply.responseCalls.baseUrl = responses.responseCallBaseUrl;
        const configText = `module.exports = ` + JSON.stringify(config, null, 4);
        fs.writeFileSync(path.resolve(fileName), configText);
        console.log(`✔ Config file ${path.resolve(fileName)} created. Take a moment to check it out, and then run \`generate\` when you're ready.`);
    }
    catch (e) {
        console.log(`❗ Failed to create config file ${fileName}: ${e.message}`);
    }
}
//# sourceMappingURL=cli.js.map