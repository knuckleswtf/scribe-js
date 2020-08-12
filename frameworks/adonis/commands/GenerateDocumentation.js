'use strict'

const path = require("path");
const fs = require("fs");

const { Command } = require.main.require('@adonisjs/ace')

class GenerateDocumentation extends Command {
    static get signature () {
        return "scribe:generate {--force : Discard any changes you've made to the Markdown files}"
    }

    static get description () {
        return 'Generate API documentation from your Adonis.js routes.'
    }

    async handle (args, options) {
        const tools = require("@knuckleswtf/scribe/dist/tools");
        const Env = use('Env');

        const configFilePath = path.resolve('.scribe.config.js')
        if (!fs.existsSync(configFilePath)) {
            tools.generateConfigFile(
                configFilePath,
                {baseUrl: Env.get('APP_URL'), localPort: Env.get('PORT')},
                {silent: true}
                );

            tools.info(`We've generated a config file (${path.resolve('.scribe.config.js')}) with some default settings for you.`);
            tools.info("Check it out later to see what you can tweak for better docs.");
        }

        console.log();
        tools.info("Generating docs...");
        console.log();

        const config = require(configFilePath);

        const Route = use('Route');
        const endpoints = await Promise.all(Route.list().map(async r => {
            let methods = r.verbs;
            const indexOfHEAD = methods.indexOf('HEAD');
            if ((indexOfHEAD > -1) && (methods.length > 1)) {
                methods.splice(indexOfHEAD, 1);
            }

            const endpoint = {
                uri: r._route,
                methods,
                handler: null,
                _adonis: r,
            };

            if (typeof r.handler == 'string') {
                const [controller, method] = r.handler.split('.');
                const controllerFile = path.resolve( `app/Controllers/Http/${controller}.js`);

                const lineNumber = await tools.searchFileLazily(controllerFile, new RegExp(`(async\\s*)?${method}\\s*\\(`));
                endpoint.declaredAt = lineNumber ? [controllerFile, lineNumber] : [];

                const controllerNamespacedName = `App/Controllers/Http/${controller}`;
                const controllerInstance = use(controllerNamespacedName);
                endpoint.handler = (new controllerInstance)[method];
            } else {// inline function was used
                endpoint.handler = r.handler;
                endpoint.declaredAt = [];

                // Get declaredAt from already-decorated decoration site
                if ((r._scribe || {}).declaredAt) {
                    endpoint.declaredAt = r._scribe.declaredAt;
                }
            }

            return endpoint;
        }));

        // Make sure app is started for response calls

        const { generate } = require('@knuckleswtf/scribe');
        await generate(endpoints, config, 'adonis', path.resolve('server.js'), options.force || false);
    }
}

module.exports = GenerateDocumentation;
