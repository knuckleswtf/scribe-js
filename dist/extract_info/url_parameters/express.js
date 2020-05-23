"use strict";
const RandExp = require('randexp');
const faker = require('faker');
const trim = require('lodash.trim');
function getUrlParams(uri, config) {
    let matches = uri.match(/:\w+\??(\(.+?\))?/g);
    if (matches === null) {
        matches = [];
    }
    const urlParameters = matches.map((match) => {
        match = trim(match, ':');
        const parameterRegexPattern = match.match(/\((.+)\)/);
        if (parameterRegexPattern) {
            match = match.replace(parameterRegexPattern[0], '');
        }
        const isOptional = match.endsWith('?');
        isOptional && (match = trim(match, '?'));
        if (!parameterRegexPattern) {
            // Simple parameter, no regex
            const example = faker.lorem.word();
            return {
                name: match,
                value: example,
                required: !isOptional,
                description: '',
            };
        }
        const pattern = parameterRegexPattern[1];
        console.log(pattern);
        const randexp = new RandExp(pattern);
        randexp.max = 2;
        const example = randexp.gen();
        return {
            name: match,
            value: example,
            required: !isOptional,
            description: '',
        };
    });
    return urlParameters;
}
module.exports = (endpoint, config) => {
    return getUrlParams(endpoint.uri, config);
};
//# sourceMappingURL=express.js.map