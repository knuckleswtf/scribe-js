"use strict";
function getParameterExample(type = 'string', regex = null) {
    const RandExp = require('randexp');
    const faker = require('faker');
    if (!regex) {
        return faker.lorem.word();
    }
    const randexp = new RandExp(regex);
    randexp.max = 2;
    return randexp.gen();
}
function removeEmptyOptionalParametersAndTransformToKeyValue(parameters = {}) {
    const cleanParameters = {};
    for (let [name, parameter] of Object.entries(parameters)) {
        if (parameter.value === null && !parameter.required) {
            continue;
        }
        cleanParameters[name] = parameter.value;
    }
    return cleanParameters;
}
module.exports = { getParameterExample, removeEmptyOptionalParametersAndTransformToKeyValue };
//# sourceMappingURL=utils.js.map