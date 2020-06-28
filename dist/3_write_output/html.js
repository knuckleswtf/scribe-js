"use strict";
const fs = require("fs");
const trim = require("lodash.trim");
const path = require("path");
const Handlebars = require("handlebars");
require('handlebars-helpers')(['string', 'comparison', 'object'], { handlebars: Handlebars });
registerPartialsInDirectory(path.join(__dirname, '../../views/partials'));
registerPartialsInDirectory(path.join(__dirname, '../../views/partials/example-requests'));
registerPartialsInDirectory(path.join(__dirname, '../../views/components'));
registerPartialsInDirectory(path.join(__dirname, '../../views/components/badges'));
Handlebars.registerHelper('defaultValue', function (value, defaultValue) {
    const out = value || defaultValue;
    return new Handlebars.SafeString(out);
});
Handlebars.registerHelper('httpMethodToCssColour', function (method) {
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
function writeIndexMarkdownFile(config, sourceOutputPath) {
    const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../views/index.hbs'), 'utf8'));
    const markdown = template({
        settings: config,
        introText: config.introText
    });
    fs.writeFileSync(sourceOutputPath + '/index.md', markdown);
}
function writeAuthMarkdownFile(config, sourceOutputPath) {
    const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../views/authentication.hbs'), 'utf8'));
    const isAuthed = config.auth.enabled || false;
    let extraAuthInfo = '', authDescription = '';
    if (isAuthed) {
        const strategy = config.auth.in;
        const parameterName = config.auth.name;
        const texts = [
            "This API is authenticated by sending ",
            "To authenticate requests, include ",
            "Authenticate requests to this API's endpoints by sending ",
        ];
        authDescription = texts[Math.floor(Math.random() * texts.length)];
        switch (strategy) {
            case 'query':
                authDescription += `a query parameter **\`${parameterName}\`** in the request.`;
                break;
            case 'body':
                authDescription += `a parameter **\`${parameterName}\`** in the body of the request.`;
                break;
            case 'bearer':
                authDescription += "an **`Authorization`** header with the value **`\"Bearer {your-token}\"`**.";
                break;
            case 'basic':
                authDescription += "an **`Authorization`** header in the form **`\"Basic {credentials}\"`**. The value of `{credentials}` should be your username/id and your password, joined with a colon (:), and then base64-encoded.";
                break;
            case 'header':
                authDescription += `a **\`${parameterName}\`** header with the value **\`"{your-token}"\`**.`;
                break;
        }
        extraAuthInfo = config.auth.extraInfo || '';
    }
    const markdown = template({
        isAuthed,
        authDescription,
        extraAuthInfo,
    });
    fs.writeFileSync(sourceOutputPath + '/authentication.md', markdown);
}
function writeGroupMarkdownFiles(endpointsToDocument, config, sourceOutputPath) {
    var _a, _b;
    !fs.existsSync(sourceOutputPath + '/groups') && fs.mkdirSync(sourceOutputPath + '/groups');
    const groupBy = require('lodash.groupby');
    const groupedEndpoints = groupBy(endpointsToDocument, 'metadata.groupName');
    for (let group of Object.values(groupedEndpoints)) {
        const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../views/partials/group.hbs'), 'utf8'));
        const groupName = group[0].metadata.groupName;
        const markdown = template({
            settings: config,
            endpoints: group,
            groupName,
            groupDescription: (_b = (_a = group.find(e => Boolean(e.metadata.groupDescription))) === null || _a === void 0 ? void 0 : _a.metadata.groupDescription) !== null && _b !== void 0 ? _b : '',
        });
        const slugify = require('slugify');
        const fileName = slugify(groupName, { lower: true });
        fs.writeFileSync(sourceOutputPath + `/groups/${fileName}.md`, markdown);
    }
}
function registerPartialsInDirectory(path) {
    fs.readdirSync(path).forEach((filename) => {
        const matches = /^([^.]+).hbs$/.exec(filename);
        if (!matches) {
            return;
        }
        // Convert name so we can reference with dot syntax in views
        const name = path.replace(/.*views(\/|\\)/g, '').replace(/\/|\\/g, '.') + `.${matches[1]}`;
        const template = fs.readFileSync(path + '/' + filename, 'utf8');
        Handlebars.registerPartial(name, template);
    });
}
function printQueryParamsAsString(cleanQueryParams) {
    let qs = '';
    for (let [parameter, value] of Object.entries(cleanQueryParams)) {
        let paramName = encodeURIComponent(parameter);
        if (!Array.isArray(value)) {
            // List query param (eg filter[]=haha should become "filter[]": "haha")
            qs += `${paramName}[]=${encodeURIComponent(value[0])}&`;
        }
        else if (typeof value === 'object') {
            // Hash query param (eg filter[name]=john should become "filter[name]": "john")
            for (let [item, itemValue] of Object.entries(value)) {
                qs += `${paramName}[${encodeURIComponent(item)}]=${encodeURIComponent(itemValue)}&`;
            }
        }
        else {
            qs += `${paramName}=${encodeURIComponent(value)}&`;
        }
    }
    return trim(qs, '&');
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
        return { [`${parameter}[]`]: value[0] };
    }
    if (typeof value === "object") {
        // Transform hashes
        let params = {};
        for (let [item, itemValue] of Object.entries(value)) {
            params[`${parameter}[${item}]`] = itemValue;
        }
        return params;
    }
    // Primitives
    return { [parameter]: value };
}
function isNonEmptyObject(value) {
    return value != null && value.constructor === Object && Object.keys(value).length > 0;
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
        if (Array.isArray(value)) {
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
module.exports = {
    writeIndexMarkdownFile,
    writeAuthMarkdownFile,
    writeGroupMarkdownFiles,
};
//# sourceMappingURL=html.js.map