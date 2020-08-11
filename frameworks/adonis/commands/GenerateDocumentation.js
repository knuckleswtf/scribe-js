'use strict'

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
        //const tools = require("@knuckleswtf/scribe/tools");
        const Env = use('Env');
        console.log(Env.get('APP_URL')); process.exit();
        const configFilePath = path.resolve('.scribe.config.js')
        if (!fs.existsSync(configFilePath)) {
            tools.generateConfigFile(configFilePath, {baseUrl: Env.APP_URL, localPort: Env.PORT})
            console.log("We've generated a config file with some settings for yu. Check it out later to see what you can tweak for better docs.");
        }

        const Route = use('Route');
        let routes = Route.list();
        routes = routes.map(r => {
            const [controller, method] = r.handler.split('.');
            // get file path
            const controllerFile = path.resolve('app/Controllers/Http/' + controller);
            // load all docblocks
            tools.hydrateDocblocksForFile(controllerFile);
            // locate line where method is declared
            route.declaredAt = [controllerFile, line]
            return route;
        });

        // dispatch Scribe generation with Adonis routes
        require("@knuckleswtf/scribe/generation").generate(routes);
        // Make sure app is started for response calls

        this.info('Dummy implementation for generate command')
    }
}

module.exports = GenerateDocumentation
