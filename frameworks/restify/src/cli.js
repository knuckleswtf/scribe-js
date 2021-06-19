#!/usr/bin/env node

require('hard-rejection')();

const fs = require("fs");
const path = require("path");
const program = require('commander');

const debug = require('debug')('lib:scribe:restify:cli');
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
    .action(async ({config, server, force, extraction, verbose}) => {
        if (verbose) {
            // Needed to do this since enable() clears all previously enabled
            const namespacesToEnable = process.env.DEBUG ? (process.env.DEBUG + ',lib:scribe*') : 'lib:scribe*';
            require('debug').enable(namespacesToEnable);
        }

        const configFile = path.resolve(config);
        const serverFile = path.resolve(server);

        if (!fs.existsSync(configFile)) {
            tools.warn(`Config file ${configFile} does not exist. Initialising with a default config file...`);
            console.log();
            await createConfigFile();
            return;
        }

        if (!extraction) {
            const configObject = require(configFile);

            const {generate} = require('@knuckleswtf/scribe');
            await generate(null, configObject, 'restify', null, {
                noExtraction: !extraction,
            });
            return;
        }

        process.env.SCRIBE_GENERATE = "1";

        const decorator = require("./decorator");
        decorator();

        require(serverFile);

        const configObject = require(configFile);
        configObject.strategies = configObject.strategies || {};
        configObject.strategies.urlParameters = (configObject.strategies.urlParameters || []).concat(path.join(__dirname, './strategies/url_parameters/restify_route_api'));

        const routes = decorator.allRoutes;
        console.log(routes);
        const {generate} = require('@knuckleswtf/scribe');
        console.log(generate);
        await generate(routes, configObject, 'restify', null, {overwriteMarkdownFiles: force});

        // Make sure to end process, in case server is still running
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