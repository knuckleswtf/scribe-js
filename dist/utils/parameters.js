"use strict";
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
            return faker.system.filePath();
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
 *     value: 12,
 *     required: false,
 *   }}
 * And transforms them into key-example pairs : {age: 12}
 * It also filters out parameters which have null values and have 'required' as false.
 * It converts all file params that have string examples to actual files (instances of UploadedFile).
 * It also generates a full example for object parameters (and array of objects) using the fields. For instance, if there's a `details` field with type "object",
 * and `details.name` and `details.age` fields, this will return {details: {name: <value>, age: <value>}}
 */
function removeEmptyOptionalParametersAndTransformToKeyExample(parameters = {}) {
    const cleanParameters = {};
    for (let [name, parameter] of Object.entries(parameters)) {
        if (parameter.value === null && !parameter.required) {
            continue;
        }
        if (name.includes('.')) { // Object field
            setObject(cleanParameters, name, parameter.value, parameters, parameter.required);
        }
        else {
            cleanParameters[name] = parameter.value;
        }
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
function prettyPrintResponseIfJson(content) {
    try {
        const parsedResponse = JSON.parse(content);
        content = JSON.stringify(parsedResponse, null, 4);
    }
    catch (e) {
    }
    return content;
}
module.exports = {
    getBaseType,
    getParameterExample,
    removeEmptyOptionalParametersAndTransformToKeyExample,
    castValueToType,
    normalizeTypeName,
    isArrayType,
    getBaseTypeFromArrayType,
    prettyPrintResponseIfJson,
};
//# sourceMappingURL=parameters.js.map