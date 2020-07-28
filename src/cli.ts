#!/usr/bin/env node
import fs = require("fs");
import path = require("path");

const VERSION = require('../package.json').version;
import program = require('commander');
program
    .name('Scribe')
    .version(VERSION)
    .command('generate')
    .option(
        '-c, --config <file>',
        'Scribe config file',
        '.scribe.config.js'
    )
    .requiredOption(
        '-m, --main <file>',
        'Main file of your API. This file should export your app/router object (Express).',
    )
    .option(
        '-s, --server <file>',
        'Server file of your API. This is the file that is executed by Node to start your server. ' +
        'You can omit this if your main file also starts your server.',
    )
    .description("Generate API documentation from your Node.js codebase.")
    .action(async ({ config, main, server }) => {
        const configFile = path.resolve(config);
        const mainFile = path.resolve(main);
        const serverFile = server ? path.resolve(server) : null;

        if (!fs.existsSync(configFile)) {
            console.log(`⚠ Config file ${configFile} does not exist. Initialising with a default config file...`);
            createConfigFile();
            console.log(`Take a moment to update this file, and then run this command again when you're ready.`);
            return;
        }

        const generate = require('./index');
        await generate(configFile, mainFile, serverFile);
    });

program
    .command('init')
    .description("Create config file with default options.")
    .action(createConfigFile);

program.parse(process.argv);

function createConfigFile() {
    const fileName = '.scribe.config.js';
    try {
        fs.copyFileSync(path.join(__dirname, '../config.js'), path.resolve(fileName));
        console.log(`✔ Config file ${path.resolve(fileName)} created.`);
    } catch (e) {
        console.log(`❗ Failed to create config file ${fileName}: ${e.message}`);
    }
}