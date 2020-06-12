import {scribe} from "../../../typedefs/core";
const RandExp = require('randexp');
const faker = require('faker');
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
            const example = faker.lorem.word();
            return {
                name: parameter,
                value: example,
                required: !isOptional,
                description: '',
                match,
            };
        }

        const pattern = parameterRegexPattern[1];
        const randexp = new RandExp(pattern);
        randexp.max = 2;
        const example = randexp.gen();
        return {
            name: parameter,
            value: example,
            required: !isOptional,
            description: '',
            match,
            placeholder: `:${parameter}${isOptional ? '?' : ''}`
        }
    });

    return keyBy(urlParameters, 'name');
}

export = {
    routers: [],
    run
};