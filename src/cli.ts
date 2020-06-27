#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const VERSION = require('../package.json').version;
const program = require('commander');
program
    .name('Scribe')
    .version(VERSION)
    .command('generate <mainFile>')
    .option(
        '-c, --config <file>',
        'Scribe config file',
        '.scribe.config.js'
    )
    .description("Generate API documentation from your Node.js codebase.")
    .action(async (source, { config }) => {
        if (!fs.existsSync(path.resolve(config))) {
            console.log(`⚠ Config file ${path.resolve(config)} does not exist. Initialising with a default config file...`);
            createConfigFile();
        }
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