'use strict';

const path = require("path");
const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = async function createConfigFile() {
    const fileName = '.scribe.config.js';

    tools.info(`Hi! We'll ask a few questions to help set up your config file. All questions are optional and you can set the values yourself later.`);
    tools.info('Hit Enter to skip a question.');
    console.log();

    const inquirer = require('inquirer');

    const inferredApiName = tools.inferApiName();

    const responses = await inquirer.prompt([
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
};