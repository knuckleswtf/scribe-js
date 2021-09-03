"use strict";
const TestingFile = require("./TestingFile");
const set = require('lodash.set');
const get = require('lodash.get');
function getParameterExample(type = 'string', regex = null) {
    const RandExp = require('randexp');
    const faker = require('./faker')();
    let baseType = type;
    let isListType = false;
    if (type.endsWith('[]')) {
        baseType = type.substring(0, type.length - 2).toLowerCase();
        isListType = true;
    }
    if (isListType) {
        // Return a two-array item for a list
        return [getParameterExample(baseType), getParameterExample(baseType)];
    }
    switch (normalizeTypeName(baseType)) {
        case 'number':
        case 'integer':
            return faker.random.number();
        case 'boolean':
            return faker.random.boolean();
        case 'object':
            return {};
        case 'file':
            return new TestingFile;
        case 'string':
        default:
            if (!regex) {
                return faker.lorem.word();
            }
            const randexp = new RandExp(regex);
            randexp.max = 2;
            return randexp.gen();
    }
}
function castValueToType(value, type = 'string') {
    if (value === null || value === undefined) {
        return null;
    }
    if (type.endsWith('[]')) {
        let baseType = type.substring(0, type.length - 2).toLowerCase();
        return Array.isArray(value) ? value.map(v => castValueToType(v, baseType)) : JSON.parse(value);
    }
    switch (type) {
        case 'string':
            return value.toString();
        case 'number':
        case 'int':
        case 'integer':
        case 'float':
        case 'double':
            return Number(value);
        case 'bool':
        case 'boolean':
            return value === "false" ? false : true;
        case 'object':
            return typeof value === 'string' ? JSON.parse(value) : value;
        default:
            return value;
    }
}
/**
 * This method prepares and simplifies request parameters for use in example requests and response calls.
 * It takes in an array with rich details about a parameter eg
 *   {age: {
 *     description: 'The age',
 *     example: 12,
 *     required: false,
 *   }}
 * And transforms them into key-example pairs : {age: 12}
 * It also filters out parameters which have null values and have 'required' as false.
 * It converts all file params that have string examples to actual files (instances of TestingFile).
 * It also generates a full example for object parameters (and array of objects) using the fields. For instance, if there's a `details` field with type "object",
 * and `details.name` and `details.age` fields, this will return {details: {name: <value>, age: <value>}}
 */
function cleanParams(parameters = {}) {
    let cleanParameters = {};
    for (let [name, parameter] of Object.entries(parameters)) {
        // Remove params which have no examples and are optional.
        if (parameter.example === null && !parameter.required) {
            continue;
        }
        if (parameter.type === 'file') {
            if (typeof parameter.example === 'string') {
                parameter.example = TestingFile.fromPath(parameter.example);
            }
            else if (parameter.example == null) {
                parameter.example = new TestingFile;
            }
        }
        if (name.startsWith('[].')) { // Entire body is an array
            if (!parameters["[]"]) { // Make sure there's a parent
                cleanParameters["[]"] = [{}, {}];
                parameters["[]"] = {
                    name: "[]",
                    type: "object[]",
                    description: "",
                    required: true,
                    example: { [name]: parameter.example },
                };
            }
        }
        if (name.includes('.')) { // Object field (or array of objects)
            // An important side effect of objects being passed by reference:
            // The examples in nestedBodyParameters will also be updated (correctly) by this call
            setObject(cleanParameters, name, parameter.example, parameters, parameter.required);
        }
        else {
            cleanParameters[name] = parameter.example;
        }
    }
    // Finally, if the body is an array, flatten it.
    if (cleanParameters['[]']) {
        cleanParameters = cleanParameters['[]'];
    }
    return cleanParameters;
}
function normalizeTypeName(typeName) {
    const base = typeName.toLowerCase().replace(/\[]/g, '');
    switch (base) {
        case 'int':
            return typeName.replace(base, 'integer');
        case 'float':
        case 'double':
            return typeName.replace(base, 'number');
        case 'bool':
            return typeName.replace(base, 'boolean');
        default:
            return typeName;
    }
}
function isArrayType(typeName) {
    return typeName.endsWith('[]');
}
function getBaseType(typeName) {
    let baseType = typeName;
    while (isArrayType(baseType)) {
        baseType = getBaseTypeFromArrayType(baseType);
    }
    return baseType;
}
/**
 * Array type = int[], object[]
 * @param typeName
 */
function getBaseTypeFromArrayType(typeName) {
    return typeName.substr(0, typeName.length - 2);
}
function setObject(results, path, value, source, isRequired) {
    if (path.includes('.')) {
        const parts = path.split('.');
        let [fieldName, ...parentPath] = parts.reverse();
        const baseName = parentPath.reverse().join('.');
        // For array fields, the type should be indicated in the source object by now;
        // eg test.items[] would actually be described as name: test.items, type: object[]
        // So we get rid of that ending []
        // For other fields (eg test.items[].name), it remains as-is
        let baseNameInOriginalParams = baseName;
        while (baseNameInOriginalParams.endsWith('[]')) {
            baseNameInOriginalParams = baseNameInOriginalParams.substr(0, baseNameInOriginalParams.length - 2);
        }
        // When the body is an array, param names will be  "[].paramname",
        // so baseNameInOriginalParams here will be empty
        if (path.startsWith('[].')) {
            baseNameInOriginalParams = '[]';
        }
        const parentData = get(source, baseNameInOriginalParams);
        if (parentData) {
            // Path we use for lodash.set
            const lodashPath = path.replace(/\[]/g, '.0');
            if (parentData.type === 'object') {
                if (get(results, lodashPath) === undefined) {
                    set(results, lodashPath, value);
                }
            }
            else if (parentData.type === 'object[]') {
                // When the body is an array, param names will be  "[].paramname", so dot paths won't work correctly with "[]"
                if (path.startsWith('[].')) {
                    const valueDotPath = lodashPath.slice(3); // Remove initial '.0.'
                    if (0 in results['[]'] && get(results['[]'][0], valueDotPath) === undefined) {
                        set(results['[]'][0], valueDotPath, value);
                    }
                    // If there's a second item in the array, set for that too.
                    if (value !== null && 1 in results['[]']) {
                        // If value is optional, flip a coin on whether to set or not
                        if (isRequired || Math.random() < 0.5) {
                            set(results['[]'][1], valueDotPath, value);
                        }
                    }
                }
                else {
                    if (get(results, lodashPath) === undefined) {
                        set(results, lodashPath, value);
                    }
                    // If there's a second item in the array, set for that too.
                    if (get(results, baseName.replace('[]', '.1')) !== undefined) {
                        // If value is optional, flip a coin on whether to set or not
                        if (isRequired || [true, false][Math.floor(Math.random() * 2)]) {
                            set(results, lodashPath.replace('.0', '.1'), value);
                        }
                    }
                }
            }
        }
    }
}
function prettyPrintResponseIfJson(content) {
    try {
        const parsedResponse = JSON.parse(content);
        content = JSON.stringify(parsedResponse, null, 4);
    }
    catch (e) {
    }
    return content;
}
function inferParameterDescription(uri, parameterName) {
    // If the parameter name is an id-type, like /thing(s)/:id or /:thing_id or /:thingId
    // we can try to infer a description
    let patternMatch;
    if ((patternMatch = parameterName.match(/^(.+)(_id|_ID|Id)$/))) {
        const thing = wordify(patternMatch[1]);
        return `The ID of the ${thing}.`;
    }
    if (parameterName.toLowerCase() === 'id' && (patternMatch = uri.match(new RegExp("(/|^)(.+)/:(id|ID)")))) {
        // First, we convert the pattern into a word
        const word = wordify(patternMatch[2]);
        const pluralize = require('pluralize');
        const singular = pluralize.singular(word);
        const plural = pluralize(singular);
        if (plural === word) {
            return `The ID of the ${singular}.`;
        }
    }
    return '';
}
/**
 * Convert "sideProject", "side_projects", or "side-projects" to "side project"
 * @param {string} slug
 * @returns {string}
 */
function wordify(slug) {
    return slug.replace(/[_\-]/g, ' ')
        .split(/(?=[A-Z])/).join(' ')
        .toLowerCase();
}
module.exports = {
    getBaseType,
    getParameterExample,
    cleanParams,
    castValueToType,
    normalizeTypeName,
    isArrayType,
    getBaseTypeFromArrayType,
    prettyPrintResponseIfJson,
    inferParameterDescription,
};
//# sourceMappingURL=parameters.js.map