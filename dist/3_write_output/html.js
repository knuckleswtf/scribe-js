"use strict";
const Handlebars = require("handlebars");
require('handlebars-helpers')(['string', 'comparison'], { handlebars: Handlebars });
const fs = require('fs');
const { resolve, join } = require('path');
registerPartialsInDirectory(join(__dirname, '../../views/partials'));
registerPartialsInDirectory(join(__dirname, '../../views/partials/example-requests'));
registerPartialsInDirectory(join(__dirname, '../../views/components'));
registerPartialsInDirectory(join(__dirname, '../../views/components/badges'));
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
function writeIndexMarkdownFile(config) {
    fs.mkdirSync(join(__dirname, '../../docs/'), { recursive: true });
    const template = Handlebars.compile(fs.readFileSync(resolve(__dirname, '../../views/index.hbs'), 'utf8'));
    const markdown = template({
        settings: config,
        introText: config.introText
    });
    fs.writeFileSync(join(__dirname, '../../docs/index.md'), markdown);
}
function writeAuthMarkdownFile(config) {
    const template = Handlebars.compile(fs.readFileSync(resolve(__dirname, '../../views/authentication.hbs'), 'utf8'));
    const isAuthed = config.auth.enabled || false;
    let extraInfo = '', authDescription = '';
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
            case 'query_or_body':
                authDescription += `a parameter **\`${parameterName}\`** either in the query string or in the request body.`;
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
        extraInfo = config.auth.extraInfo || '';
    }
    const markdown = template({
        isAuthed,
        authDescription,
        extraAuthInfo: extraInfo,
    });
    fs.writeFileSync(join(__dirname, '../../docs/authentication.md'), markdown);
}
function writeGroupMarkdownFiles(endpointsToDocument, config) {
    var _a, _b;
    fs.mkdirSync(join(__dirname, '../../docs/groups/'), { recursive: true });
    const groupBy = require('lodash.groupby');
    const groupedEndpoints = groupBy(endpointsToDocument, 'metadata.groupName');
    for (let group of Object.values(groupedEndpoints)) {
        const template = Handlebars.compile(fs.readFileSync(resolve(__dirname, '../../views/partials/group.hbs'), 'utf8'));
        const groupName = group[0].metadata.groupName;
        const markdown = template({
            settings: config,
            endpoints: group,
            groupName,
            groupDescription: (_b = (_a = group.find(e => Boolean(e.metadata.groupDescription))) === null || _a === void 0 ? void 0 : _a.metadata.groupDescription) !== null && _b !== void 0 ? _b : '',
        });
        const slugify = require('slugify');
        const fileName = slugify(groupName, { lower: true });
        fs.writeFileSync(join(__dirname, `../../docs/groups/${fileName}.md`), markdown);
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
module.exports = {
    writeIndexMarkdownFile,
    writeAuthMarkdownFile,
    writeGroupMarkdownFiles,
};
//# sourceMappingURL=html.js.map