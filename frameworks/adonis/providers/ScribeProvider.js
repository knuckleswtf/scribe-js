const { ServiceProvider } = require.main.require('@adonisjs/fold');

class ScribeProvider extends ServiceProvider {
    register () {
        this.app.bind('Scribe/Commands/Scribe:Generate', () => require('../commands/GenerateDocumentation'));
    }

    boot() {
        const ace = require.main.require('@adonisjs/ace')
        ace.addCommand('Scribe/Commands/Scribe:Generate')
    }
}

module.exports = ScribeProvider;