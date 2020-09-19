
import trim = require('lodash.trim');
import fs = require('fs');
import path = require('path');
import Handlebars = require("handlebars");

require('handlebars-helpers')(['string', 'comparison', 'object'], {handlebars: Handlebars});
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/partials'));
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/partials/example-requests'));
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/components'));
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/components/badges'));

Handlebars.registerHelper('objectWrap', (key, value) => ({[key]: value}));
Handlebars.registerHelper('defaultValue', (value, defaultValue) => value || defaultValue);
Handlebars.registerHelper('endsWith', (value: string, other: string) => value.endsWith(other));
Handlebars.registerHelper('httpMethodToCssColour', function (method: string) {
    const colours = {
        GET: 'green',
        HEAD: 'darkgreen',
        POST: 'black',
        PUT: 'darkblue',
        PATCH: 'purple',
        DELETE: 'red',
    };
    return new Handlebars.SafeString(colours[method.toUpperCase()]);
});
Handlebars.registerHelper('printQueryParamsAsString', printQueryParamsAsString);
Handlebars.registerHelper('escapeString', escapeString);
Handlebars.registerHelper('isNonEmptyObject', isNonEmptyObject);
Handlebars.registerHelper('printQueryParamsAsKeyValue', printQueryParamsAsKeyValue);
Handlebars.registerHelper('getParameterNamesAndValuesForFormData', getParameterNamesAndValuesForFormData);
Handlebars.registerHelper('getInputTypeForField', getInputTypeForField);
Handlebars.registerHelper('getFullNameForField', getFullNameForField);

function registerPartialsInDirectory(partialPath: string) {
    fs.readdirSync(partialPath).forEach((filename) => {
        const matches = /^([^.]+).hbs$/.exec(filename);
        if (!matches) {
            return;
        }

        // Convert name so we can reference with dot syntax in views
        const name = partialPath.replace(/.*views(\/|\\)/g, '').replace(/\/|\\/g, '.') + `.${matches[1]}`;
        const template = fs.readFileSync(path.join(partialPath, filename), 'utf8');
        Handlebars.registerPartial(name, template);
    });
}

function printQueryParamsAsString(cleanQueryParams: Record<string, any>): string {
    let qs = '';

    for (let [paramName, value] of Object.entries(cleanQueryParams)) {

        if (!Array.isArray(value)) {
            // List query param (eg filter[]=haha should become "filter[]": "haha")
            qs += `${paramName}[]=${encodeURIComponent(value[0])}&`;
        } else if (typeof value === 'object') {
            // Hash query param (eg filter[name]=john should become "filter[name]": "john")
            for (let [item, itemValue] of Object.entries(value)) {
                qs += `${paramName}[${encodeURIComponent(item)}]=${encodeURIComponent(itemValue)}&`;
            }
        } else {
            qs += `${paramName}=${encodeURIComponent(value)}&`;
        }

    }
    return trim(qs, '&');
}

function escapeString(string) {
    return JSON.stringify({[string]: 1}).slice(2, -4);
}

/**
 * Expand a request parameter into one or more parameters to be used when sending as form-data.
 * A primitive value like ("name", "John") is returned as ["name" => "John"]
 * Lists like ("filter", ["haha"]) becomes ["filter[]" => "haha"]
 * Maps like ("filter", ["name" => "john", "age" => "12"]) become ["filter[name]" => "john", "filter[age]" => 12]
 */
function getParameterNamesAndValuesForFormData(parameter: string, value: any) {
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
    } else {
        return {[`${parameter}[]`]: value[0]};
    }

    if (typeof value === "object") {
        // Transform hashes
        let params = {};
        for (let [item, itemValue] of Object.entries(value)) {

            if (Array.isArray(itemValue) || typeof value[0] === 'object') {
                const expanded = getParameterNamesAndValuesForFormData('', itemValue);
                Object.entries(expanded).forEach(([fieldName, subItemValue]) => {
                    const paramName = `${parameter}[${item}]${fieldName}`;
                    params[paramName] = subItemValue;
                });
            } else {
                params[`${parameter}[${item}]`] = itemValue;
            }
        }
        return params;
    }

    // Primitives
    return {[parameter]: value};
}

function isNonEmptyObject(value) {
    return value != null && value.constructor === Object && Object.keys(value).length > 0;
}

function printQueryParamsAsKeyValue(cleanQueryParameters, opts = {}): string {
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
        if (Array.isArray(value)) {
            // List query param (eg filter[]=haha should become "filter[]": "haha")
            output += " ".repeat(options.spacesIndentation);
            output += options.startLinesWith
                + options.quote + `${parameter}[]` + options.quote
                + options.delimiter + " "
                + options.quote + value[0] + options.quote
                + options.endLinesWith + "\n";
        } else if (typeof value === "object") {
            // Hash query param (eg filter[name]=john should become "filter[name]": "john")
            for (let [item, itemValue] of Object.entries(value)) {
                output += " ".repeat(options.spacesIndentation);
                output += options.startLinesWith
                    + options.quote + `${parameter}[${item}]` + options.quote
                    + options.delimiter + " "
                    + options.quote + itemValue + options.quote
                    + options.endLinesWith + "\n";
            }
        } else {
            // Primitives
            output += " ".repeat(options.spacesIndentation);
            output += options.startLinesWith
                + options.quote + parameter + options.quote
                + options.delimiter + " "
                + options.quote + value + options.quote
                + options.endLinesWith + "\n";
        }
    }

    let closing = options.braces[1] ? " ".repeat(options.closingBraceIndentation) + options.braces[1] : '';
    return output + closing;
}

function getFullNameForField(name: string, type?: string) {
    name = name.replace('[]', '.0');
    if (type.endsWith('[]')) {
        // Ignore the first '[]': the frontend will take care of it
        type = type.substr(0, type.length - 2);
    }
    while (type.endsWith('[]')) {
        name += '.0';
        type = type.substr(0, type.length - 2);
    }
    return name;
}

function getInputTypeForField(type: string) {
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

export = Handlebars;