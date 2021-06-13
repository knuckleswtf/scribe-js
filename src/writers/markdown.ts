import {scribe} from "../../typedefs/core";
import fs = require('fs');
import path = require('path');
import slugify = require('slugify');
import matcher = require('matcher');

import tools = require('../tools');
import Handlebars = require('../utils/handlebars');
import util = require("util");


export = (config: scribe.Config) => {

    let lastTimesWeModifiedTheseFiles = {};
    let fileModificationTimesFile = path.resolve('public/docs/.filemtimes');

    function writeDocs(
        groupedEndpoints: { [groupName: string]: scribe.Route[] },
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
            isInteractive: config.interactive,
            introText: config.introText,
            description: config.description,
            baseUrl: config.baseUrl.replace(/\/$/, ''),
            scribeVersion: process.env.SCRIBE_VERSION
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
                    authDescription += util.format('a query parameter **`%s`** in the request.', parameterName);
                    break;
                case 'body':
                    authDescription +=  util.format('a parameter **`%s`** in the body of the request.', parameterName);
                    break;
                case 'bearer':
                    authDescription += util.format('an **`Authorization`** header with the value **`"Bearer %s"`**.', config.auth.placeholder || 'your-token');
                    break;
                case 'basic':
                    authDescription += "an **`Authorization`** header in the form **`\"Basic {${config.auth.placeholder || 'credentials'}}\"`**. The value of `{credentials}` should be your username/id and your password, joined with a colon (:), and then base64-encoded.";
                    break;
                case 'header':
                    authDescription += util.format('a **`%s`** header with the value **`"%s"`**.', parameterName, config.auth.placeholder || 'your-token');
                    break;
            }
            authDescription += '\n\nAll authenticated endpoints are marked with a `requires authentication` badge in the documentation below.';
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
        groupedEndpoints: { [groupName: string]: scribe.Route[] },
        sourceOutputPath: string,
        shouldOverwriteMarkdownFiles: boolean = false
    ) {
        const groupsPath = path.join(sourceOutputPath, '/groups')
        !fs.existsSync(groupsPath) && fs.mkdirSync(groupsPath);

        const groupFileNames = Object.entries(groupedEndpoints).map(function writeGroupFileAndReturnFileName([groupName, endpoints]) {
            const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../resources/views/partials/group.hbs'), 'utf8'));
            // Needed for Try It Out
            const auth = config.auth as any;
            if (auth.in === 'bearer' || auth.in === 'basic') {
                auth.name = 'Authorization';
                auth.location = 'header';
                auth.prefix = auth.in === 'bearer' ? 'Bearer ' : 'Basic ';
            } else {
                auth.location = auth.in;
                auth.prefix = '';
            }
            const markdown = template({
                settings: config,
                auth,
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