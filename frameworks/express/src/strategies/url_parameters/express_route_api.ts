import {scribe} from "@knuckleswtf/scribe";
import utils = require("@knuckleswtf/scribe/dist/utils/parameters");
const { getParameterExample } = utils;
const trim = require('lodash.trim');
const keyBy = require('lodash.keyby');

function run(endpoint: scribe.Endpoint, config): scribe.UrlParameters {
    let uri = endpoint.uri;
    let matches = uri.match(/:\w+\??(\(.+?\))?/g);
    if (matches === null) {
        return {};
    }

    const urlParameters = matches.map((match): scribe.UrlParameter => {
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
                description: '',
                match,
            };
        }

        return {
            name: parameter,
            value: isOptional ? null : getParameterExample('string', parameterRegexPattern[1]),
            required: !isOptional,
            description: '',
            match,
            placeholder: `:${parameter}${isOptional ? '?' : ''}`
        }
    });

    return keyBy(urlParameters, 'name');
}

export = {
    routers: ['express'],
    run
};