const {getParameterExample, inferParameterDescription} = require("@knuckleswtf/scribe/dist/utils/parameters");
const tools = require("@knuckleswtf/scribe/dist/tools");
const trim = require('lodash.trim');
const keyBy = require('lodash.keyby');

function run(endpoint, config) {
    let uri = endpoint.uri;
    let matches = uri.match(/:\w+\??(\(.+?\))?/g);
    if (matches === null) {
        return {};
    }

    const urlParameters = matches.map((match) => {
        tools.debug(`Processing Restify URL parameter ` + match);
        let parameter = trim(match, ':');

        const isOptional = parameter.endsWith('?');
        isOptional && (parameter = trim(parameter, '?'));

        return {
            name: parameter,
            example: isOptional ? null : getParameterExample(),
            required: !isOptional,
            type: 'string',
            description: inferParameterDescription(uri, parameter),
            match,
        };
    });

    return keyBy(urlParameters, 'name');
}

module.exports = {
    routers: ['restify'],
    run
};