'use strict';
const path = require("path");
const rtrim = require("lodash.trimend");
const ejs = require('ejs');
function renderEjsTemplate(key, data) {
    data.utils = getUtils();
    return ejs.renderFile(path.join(__dirname, `/../../resources/views/${key}.ejs`), data);
}
function getUtils() {
    const converter = new (require('showdown').Converter)();
    return {
        slugify: require("slugify"),
        markdown: converter.makeHtml.bind(converter),
        httpMethodToCssColour,
        getInputTypeForField,
        getFullNameForField,
        isNonEmptyObject,
        escapeString,
        printQueryParamsAsString,
        printQueryParamsAsKeyValue,
        getParameterNamesAndValuesForFormData
    };
}
function httpMethodToCssColour(method) {
    const colours = {
        GET: 'green',
        HEAD: 'darkgreen',
        POST: 'black',
        PUT: 'darkblue',
        PATCH: 'purple',
        DELETE: 'red',
    };
    return colours[method.toUpperCase()];
}
function getFullNameForField(name, type) {
    name = name.replace('[]', '.0');
    if (type.endsWith('[]')) {
        // Ignore the first '[]': the frontend will take care of it
        type = type.substr(0, type.length - 2);
    }
    while (type.endsWith('[]')) {
        name += '.0';
        type = type.substr(0, type.length - 2);
    }
    // When the body is an array, the item names will be ".0.thing"
    name = name.replace(/^\./, '');
    return name;
}
function getInputTypeForField(type) {
    const baseType = type.replace('[]', '');
    let inputType = '';
    switch (baseType) {
        case 'number':
        case 'integer':
            inputType = 'number';
            break;
        case 'file':
            inputType = 'file';
            break;
        default:
            inputType = 'text';
    }
    return inputType;
}
function printQueryParamsAsString(cleanQueryParams) {
    let qs = '';
    for (let [paramName, value] of Object.entries(cleanQueryParams)) {
        if (Array.isArray(value) && value.length) {
            // List query param (eg filter[]=haha should become "filter[]": "haha")
            qs += `${paramName}[]=${encodeURIComponent(value[0])}&`;
        }
        else if (typeof value === 'object') {
            // Hash query param (eg filter[name]=john should become "filter[name]": "john")
            // Not handling nested params for now
            for (let [item, itemValue] of Object.entries(value)) {
                qs += `${paramName}[${encodeURIComponent(item)}]=${encodeURIComponent(itemValue)}&`;
            }
        }
        else {
            qs += `${paramName}=${encodeURIComponent(value)}&`;
        }
    }
    return rtrim(qs, '&');
}
function escapeString(string) {
    return JSON.stringify({ [string]: 1 }).slice(2, -4);
}
/**
 * Expand a request parameter into one or more parameters to be used when sending as form-data.
 * A primitive value like ("name", "John") is returned as ["name" => "John"]
 * Lists like ("filter", ["haha"]) becomes ["filter[]" => "haha"]
 * Maps like ("filter", ["name" => "john", "age" => "12"]) become ["filter[name]" => "john", "filter[age]" => 12]
 */
function getParameterNamesAndValuesForFormData(parameter, value) {
    if (Array.isArray(value)) {
        if (Array.isArray(value[0]) || typeof value[0] === 'object') {
            // handle nested arrays/objects
            const params = {};
            const expanded = getParameterNamesAndValuesForFormData('', value[0]);
            Object.entries(expanded).forEach(([fieldName, itemValue]) => {
                const paramName = parameter + '[]' + fieldName;
                params[paramName] = itemValue;
            });
            return params;
        }
        else {
            return { [`${parameter}[]`]: value[0] };
        }
    }
    if (typeof value === "object") {
        // Transform hashes
        let params = {};
        for (let [item, itemValue] of Object.entries(value)) {
            if (Array.isArray(itemValue) || typeof itemValue === 'object') {
                const expanded = getParameterNamesAndValuesForFormData('', itemValue);
                Object.entries(expanded).forEach(([fieldName, subItemValue]) => {
                    const paramName = `${parameter}[${item}]${fieldName}`;
                    params[paramName] = subItemValue;
                });
            }
            else {
                params[`${parameter}[${item}]`] = itemValue;
            }
        }
        return params;
    }
    // Primitives
    return { [parameter]: value };
}
function isNonEmptyObject(value) {
    return value != null && Object.keys(value).length > 0;
}
function printQueryParamsAsKeyValue(cleanQueryParameters, opts = {}) {
    let defaults = {
        quote: '"',
        delimiter: ":",
        spacesIndentation: 4,
        braces: "{}",
        closingBraceIndentation: 0,
        startLinesWith: '',
        endLinesWith: ','
    };
    let options = Object.assign(defaults, opts);
    let output = options.braces[0] ? `{${options.braces[0]}\n` : '';
    for (let [parameter, value] of Object.entries(cleanQueryParameters)) {
        if (Array.isArray(value) && value.length) {
            // List query param (eg filter[]=haha should become "filter[]": "haha")
            output += " ".repeat(options.spacesIndentation);
            output += options.startLinesWith
                + options.quote + `${parameter}[]` + options.quote
                + options.delimiter + " "
                + options.quote + value[0] + options.quote
                + options.endLinesWith + "\n";
        }
        else if (typeof value === "object") {
            // Hash query param (eg filter[name]=john should become "filter[name]": "john")
            for (let [item, itemValue] of Object.entries(value)) {
                output += " ".repeat(options.spacesIndentation);
                output += options.startLinesWith
                    + options.quote + `${parameter}[${item}]` + options.quote
                    + options.delimiter + " "
                    + options.quote + itemValue + options.quote
                    + options.endLinesWith + "\n";
            }
        }
        else {
            // Primitives
            const formattedValue = typeof value === "boolean" ? (value ? 1 : 0) : value;
            output += " ".repeat(options.spacesIndentation);
            output += options.startLinesWith
                + options.quote + parameter + options.quote
                + options.delimiter + " "
                + options.quote + formattedValue + options.quote
                + options.endLinesWith + "\n";
        }
    }
    let closing = options.braces[1] ? " ".repeat(options.closingBraceIndentation) + options.braces[1] : '';
    return output + closing;
}
function copyDirectory(sourceDir, destDir) {
    const ncp = require('ncp').ncp;
    const promisifiedNcp = require('util').promisify(ncp);
    const fs = require('fs');
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    return promisifiedNcp(sourceDir, destDir);
}
module.exports = {
    renderEjsTemplate,
    copyDirectory,
};
//# sourceMappingURL=writing.js.map