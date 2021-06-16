#!/usr/bin/env node
require('hard-rejection')();

const fs = require("fs");
const path = require("path");
const program = require('commander');

const debug = require('debug')('lib:scribe:express:cli');
const tools = require("@knuckleswtf/scribe/dist/tools");
process.env.SCRIBE_VERSION = require('../package.json').version;

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
    .description("Generate API documentation from your Express routes.")
    .action(async ({config, app, server, force, extraction, verbose}) => {
        if (verbose) {
            // Needed to do this since enable() clears all previously enabled
            const namespacesToEnable = process.env.DEBUG ? (process.env.DEBUG + ',lib:scribe*') : 'lib:scribe*';
            require('debug').enable(namespacesToEnable);
        }

        const configFile = path.resolve(config);
        const appFile = path.resolve(app);
        const serverFile = server ? path.resolve(server) : null;

        if (!fs.existsSync(configFile)) {
            tools.warn(`Config file ${configFile} does not exist. Initialising with a default config file...`);
            console.log();
            await createConfigFile();
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
        require(appFile);

        const decorator = require("./decorator");

        if (!decorator.decorated) {
            tools.error("Couldn't find any routes. Did you remember to add `require('@knuckleswtf/scribe-express')()` before registering your Express routes?");
            process.exit(1);
        }

        const configObject = require(configFile);
        // @ts-ignore
        configObject.strategies = configObject.strategies || {};
        configObject.strategies.urlParameters = (configObject.strategies.urlParameters || []).concat(path.join(__dirname, './strategies/url_parameters/express_route_api'));

        const endpoints = require('./get_routes.js')(decorator);

        const {generate} = require('@knuckleswtf/scribe');
        await generate(endpoints, configObject, 'express', serverFile, {overwriteMarkdownFiles: force});

        // Make sure to end process, in case server is still running
        // Wrapping in a timeout because it seems sometimes ncp/pastel fails to copy over all assets in time
        setTimeout(() => process.exit(0), 1300);
    });


program
    .command('init')
    .description("Initialise a config file in the root of your project.")
    .action(createConfigFile);

program.parse(process.argv);

async function createConfigFile() {
    const fileName = '.scribe.config.js';

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