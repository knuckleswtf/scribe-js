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
        let parameterName = trim(match, ':');

        const parameterRegexPattern = match.match(/\((.+)\)/);
        if (parameterRegexPattern) {
            parameterName = parameterName.replace(parameterRegexPattern[0], '');
        }

        const isOptional = parameterName.endsWith('?');
        isOptional && (parameterName = trim(name, '?'));

        if (!parameterRegexPattern) {
            // Simple parameter, no regex
            return {
                name: parameterName,
                example: isOptional ? null : getParameterExample(),
                required: !isOptional,
                type: 'string',
                description: getDescription(uri, match, parameterName),
                match,
            };
        }
        let {example, type} = getTypeAndExample(parameterRegexPattern);

        return {
            name: parameterName,
            example: isOptional ? null : example,
            required: !isOptional,
            description: getDescription(uri, match, parameterName),
            type,
            match,
            placeholder: `:${parameterName}${isOptional ? '?' : ''}`
        }
    });

    return keyBy(urlParameters, 'name');
}

module.exports = {
    routers: ['express'],
    run
};

function getTypeAndExample(parameterRegexPattern) {
    const example = getParameterExample('string', parameterRegexPattern[1]);
    // If the parameter includes a regex, like /thing/:id(\d+),
    // we can try to use that regex to figure out its type
    let type;
    if (String(parseInt(example)) === example) {
        type = 'integer';
    } else if (String(parseFloat(example)) === example) {
        type = 'number';
    } else {
        type = 'string';
    }
    return {example, type};
}

function getDescription(uri, match, parameterName) {
    // If the parameter name is an id-type, like /thing/:id or /things/:thing_id
    // we can try to infer a description
    let patternMatch;
    if ((patternMatch = parameterName.match(/^(.+)_id$/))) {
        const thing = patternMatch[1];
        return `The ID of the ${thing}.`;
    }

    if (parameterName === 'id' && (patternMatch = uri.match(new RegExp("(/|^)(.+)/:id")))) {
        const pluralize = require('pluralize');
        const thing = pluralize.singular(patternMatch[2]);
        return `The ID of the ${thing}.`;
    }

    return '';
}