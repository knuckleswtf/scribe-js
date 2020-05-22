"use strict";
const RandExp = require('randexp');
const faker = require('faker');
const trim = require('lodash.trim');
function getUrlParams(fullPath) {
    let matches = fullPath.match(/:\w+\??(\(.+?\))?/g);
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
                example,
                isOptional,
                pattern: null,
            };
        }
        const pattern = parameterRegexPattern[1];
        console.log(pattern);
        const randexp = new RandExp(pattern);
        randexp.max = 2;
        const example = randexp.gen();
        return {
            name: match,
            example,
            isOptional,
            pattern,
        };
    });
    return urlParameters;
}
module.exports = (route, mainFilePath, config) => {
    return getUrlParams(route.fullPath);
};
//# sourceMappingURL=express.js.map