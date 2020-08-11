"use strict";
const utils = require("../../utils/parameters");
const { getParameterExample } = utils;
const keyBy = require('lodash.keyby');
function run(endpoint, config) {
    const parameters = endpoint._adonis._keys;
    const urlParameters = parameters.map(p => {
        let type = 'string';
        let usePattern = p.pattern;
        if (p.pattern === '[^\\/]+?') { // Adonis' default route pattern
            // since basically anything matches this pattern, randexp gives a poor result, so we don't use the patternit
            usePattern = undefined;
            if (p.name === 'id') {
                // If it's an ID param and doesn't have a special regex. We'll assume it's a number
                type = 'number';
            }
        }
        return {
            name: p.name,
            value: p.optional ? null : getParameterExample(type, usePattern),
            required: !p.optional,
            description: '',
            match: `:${p.name}${p.optional ? '?' : ''}`
        };
    });
    return keyBy(urlParameters, 'name');
}
module.exports = {
    routers: ['adonis'],
    run
};
//# sourceMappingURL=adonis_route_api.js.map