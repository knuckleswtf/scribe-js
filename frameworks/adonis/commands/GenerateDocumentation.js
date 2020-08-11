'use strict'

const path = require("path");
const fs = require("fs");

const { Command } = require.main.require('@adonisjs/ace')

class GenerateDocumentation extends Command {
    static get signature () {
        return 'scribe:generate'
    }

    static get description () {
        return 'Tell something helpful about this command'
    }

    async handle (args, options) {
        // Generate config file with Env.APP_URL, and folder name

        const tools = require("@knuckleswtf/scribe/dist/tools");
        const Env = use('Env');

        const configFilePath = path.resolve('.scribe.config.js')
        if (!fs.existsSync(configFilePath)) {
            tools.generateConfigFile(configFilePath, {baseUrl: Env.APP_URL, localPort: Env.PORT}, {silent: true})

            this.info("We've generated a config file with some default settings for you.");
            this.info("Check it out later to see what you can tweak for better docs.");
        }
        const config = require(configFilePath);

        const Route = use('Route');
        const endpoints = await Promise.all(Route.list().map(async r => {
            let methods = r.verbs;
            const indexOfHEAD = r.verbs.indexOf('HEAD');
            if (indexOfHEAD) {
                methods = methods.splice(indexOfHEAD, 1);
            }

            const endpoint = {
                uri: r._route,
                methods,
                handler: null,
                _adonis: r,
            };

            if (typeof r.handler == 'string') {
                const [controller, method] = r.handler.split('.');
                const fullControllerName = 'app/Controllers/Http/' + controller;
                const controllerFile = path.resolve(fullControllerName + '.js');

                const lineNumber = await tools.searchFileLazily(controllerFile, new RegExp(`(async\\s*)?${method}\\s*\\(`));
                endpoint.declaredAt = lineNumber ? [controllerFile, lineNumber] : [];

                const controllerInstance = use(controllerFile);
                endpoint.handler = (new controllerInstance)[method];
            } else {// inline function was used
                endpoint.handler = r.handler;
                endpoint.declaredAt = [];
            }

            return endpoint;
        }));

        // Make sure app is started for response calls

        const { generate } = require('@knuckleswtf/scribe');
        await generate(endpoints, config, 'adonis');
    }
}

module.exports = GenerateDocumentation
