const { getParameterExample } = require("@knuckleswtf/scribe/dist/utils/parameters");
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
        tools.debug(`Processing Express URL parameter ` + match);
        let parameter = trim(match, ':');

        const parameterRegexPattern = parameter.match(/\((.+)\)/);
        if (parameterRegexPattern) {
            parameter = parameter.replace(parameterRegexPattern[0], '');
        }

        const isOptional = parameter.endsWith('?');
        isOptional && (parameter = trim(parameter, '?'));

        if (!parameterRegexPattern) {
            // Simple parameter, no regex
            return {
                name: parameter,
                example: isOptional ? null : getParameterExample(),
                required: !isOptional,
                type: 'string',
                description: '',
                match,
            };
        }

        const example = getParameterExample('string', parameterRegexPattern[1]);
        return {
            name: parameter,
            example: isOptional ? null : example,
            required: !isOptional,
            description: '',
            type: 'string',
            match,
            placeholder: `:${parameter}${isOptional ? '?' : ''}`
        }
    });

    return keyBy(urlParameters, 'name');
}

module.exports = {
    routers: ['express'],
    run
};