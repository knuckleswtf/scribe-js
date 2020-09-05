import {scribe} from "../../typedefs/core";

function getParameterExample(type = 'string', regex: string = null) {
    const RandExp = require('randexp');
    const faker = require('./faker')();

    let baseType = type;
    let isListType = false;

    if (type.endsWith('[]')) {
        baseType = type.substring(0, type.length - 2).toLowerCase();
        isListType = true;
    }

    let value = null;

    switch (normalizeTypeName(baseType)) {
        case 'number':
        case 'integer':
            value = faker.random.number();
            break;

        case 'boolean':
            value = faker.random.boolean();
            break;

        case 'object':
            value = {};
            break;

        case 'string':
        default:
            if (!regex) {
                value = faker.lorem.word();
                break;
            }

            const randexp = new RandExp(regex);
            randexp.max = 2;
            value = randexp.gen();
            break;
    }

    // Return a two-array item for a list
    return isListType ? [value, getParameterExample(baseType)] : value;
}

function castValueToType(value: any, type = 'string') {
    if (value === null) {
        return value;
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
function removeEmptyOptionalParametersAndTransformToKeyExample(parameters: scribe.ParameterBag = {}) {
    const cleanParameters = {};
    for (let [name, parameter] of Object.entries(parameters)) {
        if (parameter.value === null && !parameter.required) {
            continue;
        }

        if (name.includes('[].')){ // A field from an array of objects
            const [baseName, fieldName] = name.split('[].', 2);
            if (parameters[baseName] && parameters[baseName].type === 'object[]') {
                // Build up the corresponding field in the parent object[] entry
                if (!cleanParameters[baseName]) {
                    cleanParameters[baseName] = [{}];
                }
                cleanParameters[baseName][0][fieldName] = parameter.value;

                // Backport the value so it doesn't get overwritten
                // by the setter some lines below (in case the base object comes *after* the field)
                parameters[baseName].value = cleanParameters[baseName];
                continue;
            }
        } else if (name.includes('.')){ // Likely an object field
            const [baseName, fieldName] = name.split('.', 2);
            if (parameters[baseName] && parameters[baseName].type === 'object') {
                // Build up the corresponding field in the parent object entry
                if (!cleanParameters[baseName]) {
                    cleanParameters[baseName] = {};
                }
                cleanParameters[baseName][fieldName] = parameter.value;

                // Backport the value so it doesn't get overwritten
                // by the setter some lines below (in case the base object comes *after* the field)
                parameters[baseName].value = cleanParameters[baseName];
                continue;
            }
        }

        cleanParameters[name] = parameter.value;
    }
    return cleanParameters;
}

function gettype(value: any) {
    if (Array.isArray(value)) {
        return 'array';
    }

    if (value === null) {
        return 'null';
    }

    if (Number.isInteger(value)) {
        return 'integer';
    }

    return typeof value;
}

function normalizeTypeName(typeName: string) {
    switch (typeName) {
        case 'int':
            return 'integer';
        case 'float':
        case 'double':
            return 'number';
        case 'bool':
            return 'boolean';
        default:
            return typeName.toLowerCase();
    }
}

function isArrayType(typeName: string) {
    return typeName.endsWith('[]');
}

/**
 * Array type = int[], object[]
 * @param typeName
 */
function getBaseTypeFromArrayType(typeName: string) {
    return typeName.substr(0, typeName.length - 2);
}

export = {
    getParameterExample,
    removeEmptyOptionalParametersAndTransformToKeyExample,
    castValueToType,
    gettype,
    normalizeTypeName,
    isArrayType,
    getBaseTypeFromArrayType,
};