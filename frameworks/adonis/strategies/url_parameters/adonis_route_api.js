const { getParameterExample } = require("@knuckleswtf/scribe/dist/utils/parameters");
const keyBy = require('lodash.keyby');
const debug = require('debug')('lib:scribe:adonis:urlparams');

function run(endpoint, config) {
    const parameters = endpoint._adonis._keys;
    const urlParameters = parameters.map(p => {
        debu(`Processing Restify URL parameter ` + JSON.stringify(p));
        let type = 'string';
        let usePattern = p.pattern;

        if (p.pattern === '[^\\/]+?') { // Adonis' default route pattern
            // since basically anything matches this pattern, randexp gives a poor result, so we don't use the patternit
            usePattern = undefined;

            if (p.name === 'id') {
                // If it's an ID param and doesn't have a special regex. We'll assume it's a number
                type = 'number'
            }
        }

        return {
            name: p.name,
            value: p.optional ? null : getParameterExample(type, usePattern),
            type,
            required: !p.optional,
            description: '',
            match: `:${p.name}${p.optional ? '?' : ''}`
        }
    });

    return keyBy(urlParameters, 'name');
}

module.exports = {
    routers: ['adonis'],
    run
};