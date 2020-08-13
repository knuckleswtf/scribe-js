'use strict'

const path = require("path");

const { Command } = require.main.require('@adonisjs/ace')

class InitialiseConfigFile extends Command {
    static get signature () {
        return 'scribe:init'
    }

    static get description () {
        return 'Initialise a config file in the root of your project.'
    }

    async handle (args, options) {
        const tools = require("@knuckleswtf/scribe/dist/tools");
        const Env = use('Env');

        const fileName = '.scribe.config.js';

        tools.info(`Hi! We'll ask a few questions to help set up your config file. All questions are optional and you can set the values yourself later.`);
        tools.info('Hit Enter to skip a question.');
        console.log();

        const inferredApiName = tools.inferApiName();

        const name = await this.ask("What's the name of your API? :", inferredApiName);
        const baseUrl = await this.ask("What base URL do you want to show up in your API docs? :",  Env.get('APP_URL'));
        const localPort = await this.ask("What port do you run your API on in localhost? :", Env.get('PORT'));

        tools.info("Cool, thanks!");
        console.log();

        tools.generateConfigFile(path.resolve(fileName), {
            name: name,
            baseUrl: baseUrl,
            localPort: localPort
        });

        tools.info(`Take a moment to check it out, and then run \`scribe:generate\` when you're ready.`);
    }
}

module.exports = InitialiseConfigFile;
