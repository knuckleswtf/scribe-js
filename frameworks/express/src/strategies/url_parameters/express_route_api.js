const { getParameterExample } = require("@knuckleswtf/scribe/dist/utils/parameters");
const trim = require('lodash.trim');
const keyBy = require('lodash.keyby');
const debug = require('debug')('lib:scribe:express:urlparams');

function run(endpoint, config) {
    let uri = endpoint.uri;
    let matches = uri.match(/:\w+\??(\(.+?\))?/g);
    if (matches === null) {
        return {};
    }

    const urlParameters = matches.map((match) => {
        debug(`Processing Express URL parameter ` + match);
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
                value: isOptional ? null : getParameterExample(),
                required: !isOptional,
                type: 'string',
                description: '',
                match,
            };
        }

        return {
            name: parameter,
            example: isOptional ? null : getParameterExample('string', parameterRegexPattern[1]),
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