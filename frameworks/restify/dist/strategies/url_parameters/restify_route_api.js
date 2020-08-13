"use strict";
const utils = require("@knuckleswtf/scribe/dist/utils/parameters");
const { getParameterExample } = utils;
const trim = require('lodash.trim');
const keyBy = require('lodash.keyby');
function run(endpoint, config) {
    let uri = endpoint.uri;
    let matches = uri.match(/:\w+\??(\(.+?\))?/g);
    if (matches === null) {
        return {};
    }
    const urlParameters = matches.map((match) => {
        let parameter = trim(match, ':');
        const isOptional = parameter.endsWith('?');
        isOptional && (parameter = trim(parameter, '?'));
        return {
            name: parameter,
            value: isOptional ? null : getParameterExample(),
            required: !isOptional,
            description: '',
            match,
        };
    });
    return keyBy(urlParameters, 'name');
}
module.exports = {
    routers: ['restify'],
    run
};
//# sourceMappingURL=restify_route_api.js.map