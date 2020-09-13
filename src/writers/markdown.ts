import {scribe} from "../../typedefs/core";
import fs = require('fs');
import trim = require('lodash.trim');
import path = require('path');
import slugify = require('slugify');
import matcher = require('matcher');
import Handlebars = require("handlebars");

import tools = require('../tools');

require('handlebars-helpers')(['string', 'comparison', 'object'], {handlebars: Handlebars});
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/partials'));
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/partials/example-requests'));
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/components'));
registerPartialsInDirectory(path.join(__dirname, '../../resources/views/components/badges'));

Handlebars.registerHelper('objectWrap', (key, value) => ({[key]: value}));
Handlebars.registerHelper('defaultValue', (value, defaultValue) => new Handlebars.SafeString(value || defaultValue));
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

export = (config: scribe.Config) => {

    let lastTimesWeModifiedTheseFiles = {};
    let fileModificationTimesFile = path.resolve('public/docs/.filemtimes');

    function writeDocs(
        groupedEndpoints: { [groupName: string]: scribe.Endpoint[] },
        sourceOutputPath: string,
        shouldOverwriteMarkdownFiles: boolean
    ) {
        fileModificationTimesFile = path.join(sourceOutputPath, '/.filemtimes');
        lastTimesWeModifiedTheseFiles = fetchLastTimeWeModifiedFilesFromTrackingFile(fileModificationTimesFile);

        !fs.existsSync(sourceOutputPath) && fs.mkdirSync(sourceOutputPath, {recursive: true});
        writeIndexMarkdownFile(sourceOutputPath, shouldOverwriteMarkdownFiles);
        writeAuthMarkdownFile(sourceOutputPath, shouldOverwriteMarkdownFiles);
        writeGroupMarkdownFiles(groupedEndpoints, sourceOutputPath, shouldOverwriteMarkdownFiles);
        writeModificationTimesTrackingFile(fileModificationTimesFile, lastTimesWeModifiedTheseFiles);
    }

    function writeFile(filePath: string, content: string) {
        fs.writeFileSync(filePath, content);
        // Using the time at a seconds precision, not milliseconds
        // Because fs.stat's mtime always seems to be after the actual time here, even without modifications
        // Seems to be overly-precise 🙂
        lastTimesWeModifiedTheseFiles[filePath] = Math.floor(Date.now() / 1000);
    }

    function writeIndexMarkdownFile(sourceOutputPath: string, shouldOverwriteMarkdownFiles: boolean = false) {
        const indexMarkdownFile = path.join(sourceOutputPath, '/index.md');
        if (hasFileBeenModified(indexMarkdownFile, lastTimesWeModifiedTheseFiles)) {
            if (shouldOverwriteMarkdownFiles) {
                tools.warn(`Discarding manual changes for file ${indexMarkdownFile} because you specified --force`);
            } else {
                tools.warn(`Skipping modified file ${indexMarkdownFile}`);
                return;
            }
        }

        const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../resources/views/index.hbs'), 'utf8'));
        const markdown = template({
            settings: config,
            introText: config.introText,
            description: config.description,
        });
        writeFile(indexMarkdownFile, markdown);
    }

    function writeAuthMarkdownFile(sourceOutputPath: string, shouldOverwriteMarkdownFiles: boolean = false) {
        const authMarkdownFile = path.join(sourceOutputPath, '/authentication.md');
        if (hasFileBeenModified(authMarkdownFile, lastTimesWeModifiedTheseFiles)) {
            if (shouldOverwriteMarkdownFiles) {
                tools.warn(`Discarding manual changes for file ${authMarkdownFile} because you specified --force`);
            } else {
                tools.warn(`Skipping modified file ${authMarkdownFile}`);
                return;
            }
        }

        const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../resources/views/authentication.hbs'), 'utf8'));
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
        writeFile(authMarkdownFile, markdown);
    }

    function writeGroupMarkdownFiles(
        groupedEndpoints: { [groupName: string]: scribe.Endpoint[] },
        sourceOutputPath: string,
        shouldOverwriteMarkdownFiles: boolean = false
    ) {
        const groupsPath = path.join(sourceOutputPath, '/groups')
        !fs.existsSync(groupsPath) && fs.mkdirSync(groupsPath);

        const groupFileNames = Object.entries(groupedEndpoints).map(function writeGroupFileAndReturnFileName([groupName, endpoints]) {
            const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../resources/views/partials/group.hbs'), 'utf8'));
            const markdown = template({
                settings: config,
                endpoints,
                groupName,
                groupDescription: endpoints.find(e => Boolean(e.metadata.groupDescription))?.metadata.groupDescription ?? '',
            });

            // @ts-ignore
            const fileName = slugify(groupName, {lower: true});
            const routeGroupMarkdownFile = sourceOutputPath + `/groups/${fileName}.md`;

            if (hasFileBeenModified(routeGroupMarkdownFile, lastTimesWeModifiedTheseFiles)) {
                if (shouldOverwriteMarkdownFiles) {
                    tools.warn(`Discarding manual changes for file ${routeGroupMarkdownFile} because you specified --force`);
                } else {
                    tools.warn(`Skipping modified file ${routeGroupMarkdownFile}`);
                    return `${fileName}.md`;
                }
            }

            writeFile(routeGroupMarkdownFile, markdown);
            return `${fileName}.md`;
        });

        // Now, we need to delete any other Markdown files in the groups/ directory.
        // Why? Because, if we don't, if a user renames a group, the old file will still exist,
        // so the docs will have those endpoints repeated under the two groups.
        const filesInGroupFolder = fs.readdirSync(sourceOutputPath + "/groups");
        const filesNotPresentInThisRun = filesInGroupFolder.filter(fileName => !matcher.isMatch(groupFileNames, fileName));
        filesNotPresentInThisRun.forEach(fileName => {
            fs.unlinkSync(`${sourceOutputPath}/groups/${fileName}`);
        });
    }

    return {
        writeDocs,
        writeIndexMarkdownFile,
        writeAuthMarkdownFile,
        writeGroupMarkdownFiles,
    };

};

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

    for (let [parameter, value] of Object.entries(cleanQueryParams)) {
        let paramName = encodeURIComponent(parameter);

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
        return {[`${parameter}[]`]: value[0]};
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

function hasFileBeenModified(filePath: string, lastTimesWeModifiedTheseFiles: {}): boolean {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    const oldFileModificationTime = lastTimesWeModifiedTheseFiles[filePath] ?? null;

    if (oldFileModificationTime) {
        const latestFileModifiedTime = getFileModificationTime(filePath);
        const wasFileModifiedManually = latestFileModifiedTime > Number(oldFileModificationTime);

        return wasFileModifiedManually;
    }

    return false;
}

function getFileModificationTime(filePath) {
    try {
        return Math.floor(fs.statSync(filePath).mtime.getTime() / 1000);
    } catch (e) {
        // If we encounter a nonexistent file
        return 0;
    }
}

function writeModificationTimesTrackingFile(trackingFilePath, lastTimesWeModifiedTheseFiles): void {
    let content = "# GENERATED. YOU SHOULDN'T MODIFY OR DELETE THIS FILE.\n";
    content += "# Scribe uses this file to know when you change something manually in your docs.\n";
    content += Object.entries(lastTimesWeModifiedTheseFiles)
        .map(([filePath, mtime]) => `${filePath}=${mtime}`).join("\n");
    fs.writeFileSync(trackingFilePath, content);
}

function fetchLastTimeWeModifiedFilesFromTrackingFile(trackingFilePath) {
    if (fs.existsSync(trackingFilePath)) {
        const mtimeFileContent = fs.readFileSync(trackingFilePath, "utf8").trim().split("\n");
        // First two lines are comments
        mtimeFileContent.shift();
        mtimeFileContent.shift();

        return mtimeFileContent.reduce(function (all, line) {
            const [filePath, modificationTime] = line.split("=");
            all[filePath] = modificationTime;
            return all;
        }, {});
    }

    return {};
}