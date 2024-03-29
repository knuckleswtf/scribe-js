const { getParameterExample, inferParameterDescription } = require("@knuckleswtf/scribe/dist/utils/parameters");
const tools = require("@knuckleswtf/scribe/dist/tools");
const keyBy = require('lodash.keyby');

function run(endpoint, config) {
    const parameters = endpoint.originalRoute._keys;
    const urlParameters = parameters.map(p => {
        tools.debug(`Processing Adonis URL parameter ` + JSON.stringify(p));
        let type = 'string';
        let usePattern = p.pattern;

        if (p.pattern === '[^\\/]+?') { // Adonis' default route pattern
            // Since basically anything matches this pattern, randexp gives a useless result
            usePattern = undefined;

            if (p.name === 'id') {
                // If it's an ID param and doesn't have a special regex. We'll assume it's a number
                type = 'number'
            }
        }

        return {
            name: p.name,
            example: p.optional ? null : getParameterExample(type, usePattern),
            type,
            required: !p.optional,
            description: inferParameterDescription(endpoint.uri, p.name),
            match: `:${p.name}${p.optional ? '?' : ''}`
        }
    });

    return keyBy(urlParameters, 'name');
}

module.exports = {
    routers: ['adonis'],
    run
};