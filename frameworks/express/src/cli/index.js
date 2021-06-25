#!/usr/bin/env node
require('hard-rejection')();

const program = require('commander');

process.env.SCRIBE_VERSION = require('../../package.json').version;

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
        "Discard any changes you've made to the YAML or Markdown files",
        false,
    )
    .option(
        '--no-extraction',
        "Skip extraction of route and API info and just transform the YAML and Markdown files into HTML",
        false,
    )
    .option(
        '--verbose',
        "Enable debug logging",
        false,
    )
    .description("Generate API documentation from your Express routes.")
    .action((...args) => require('./generate')(...args));


program
    .command('init')
    .description("Initialise a config file in the root of your project.")
    .action((...args) => require('./init')(...args));

program.parse(process.argv);
