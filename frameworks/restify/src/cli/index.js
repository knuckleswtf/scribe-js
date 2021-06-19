#!/usr/bin/env node

require('hard-rejection')();

process.env.SCRIBE_VERSION = require('../../package.json').version;

const program = require('commander');

program
    .name('Scribe')
    .version(process.env.SCRIBE_VERSION)
    .command('generate')
    .option(
        '-c, --config <file>',
        'Scribe config file',
        '.scribe.config.js'
    )
    .option(
        '-s, --server <file>',
        'The file where you set up and start your Restify server. Make sure it exports your server object.',
        'index.js',
    )
    .option(
        '-f, --force',
        "Discard any changes you've made to the source Markdown files",
        false,
    )
    .option(
        '--no-extraction',
        "Skip extraction of route info and just transform the Markdown files",
        false,
    )
    .option(
        '--verbose',
        "Enable debug logging",
        false,
    )
    .description("Generate API documentation from your Restify routes.")
    .action((...args) => require('./generate')(...args));


program
    .command('init')
    .description("Initialise a config file in the root of your project.")
    .action((...args) => require('./init')(...args));

program.parse(process.argv);