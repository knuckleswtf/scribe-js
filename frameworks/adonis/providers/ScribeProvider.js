const { ServiceProvider } = require.main.require('@adonisjs/fold');
const tools = require("@knuckleswtf/scribe/dist/tools");

class ScribeProvider extends ServiceProvider {
    register () {
        this.app.bind('Scribe/Commands/Scribe:Generate', () => require('../commands/GenerateDocumentation'));
        this.app.bind('Scribe/Commands/Scribe:Init', () => require('../commands/InitialiseConfigFile'));
    }

    boot() {
        const ace = require.main.require('@adonisjs/ace');
        ace.addCommand('Scribe/Commands/Scribe:Generate');
        ace.addCommand('Scribe/Commands/Scribe:Init');
        this.decorateAdonisRouter();
    }

    decorateAdonisRouter() {
        const Route = use('Route');
        const methods = ['get', 'post', 'put', 'patch', 'delete'];

        methods.forEach(function decorateRouterMethodWithStackTraceCapturer(method) {
            const original = Route[method].bind(Route);
            Route[method] = function (route, handler) {
                if (typeof handler !== "function") {
                    return original(route, handler);
                }

                const frameAtCallSite = tools.getFrameAtCallSite("ScribeProvider.js");
                const [filePath, lineNumber]
                    = frameAtCallSite.split(/:(?=\d)/);  // any colon followed by a number. This is important bc file paths may have colons

                const returnedRoute = original(route, handler);

                returnedRoute._scribe = {declaredAt: [filePath, lineNumber]};

                return returnedRoute;
            };
        });
    }
}

module.exports = ScribeProvider;