'use strict';
const fs = require("fs");
const path = require("path");
const tools = require("../tools");
const Handlebars = require("../utils/handlebars");
const util = require("util");
function hashContent(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest("hex");
}
module.exports = (config, outputPath = '.scribe') => {
    const trackingFilePath = path.resolve(path.join(outputPath, '/.filehashes'));
    let lastKnownFileContentHashes = {};
    function writeIntroAndAuthFiles() {
        !fs.existsSync(outputPath) && fs.mkdirSync(outputPath, { recursive: true });
        fetchFileHashesFromTrackingFile();
        writeIntroMarkdownFile();
        writeAuthMarkdownFile();
        writeContentsTrackingFile();
    }
    function writeFile(filePath, content) {
        fs.writeFileSync(filePath, content);
        lastKnownFileContentHashes[filePath] = hashContent(content);
    }
    function writeIntroMarkdownFile(shouldOverwriteMarkdownFiles = false) {
        const introMarkdownFile = outputPath + '/intro.md';
        if (hasFileBeenModified(introMarkdownFile)) {
            if (shouldOverwriteMarkdownFiles) {
                tools.warn(`Discarding manual changes for file ${introMarkdownFile} because you specified --force`);
            }
            else {
                tools.warn(`Skipping modified file ${introMarkdownFile}`);
                return;
            }
        }
        const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../resources/views/intro.hbs'), 'utf8'));
        const markdown = template({
            introText: config.introText,
            description: config.description,
            baseUrl: config.baseUrl.replace(/\/$/, ''),
            settings: config,
            isInteractive: config.interactive,
            scribeVersion: process.env.SCRIBE_VERSION
        });
        writeFile(introMarkdownFile, markdown);
    }
    function writeAuthMarkdownFile(shouldOverwriteMarkdownFiles = false) {
        const authMarkdownFile = outputPath + '/auth.md';
        if (hasFileBeenModified(authMarkdownFile)) {
            if (shouldOverwriteMarkdownFiles) {
                tools.warn(`Discarding manual changes for file ${authMarkdownFile} because you specified --force`);
            }
            else {
                tools.warn(`Skipping modified file ${authMarkdownFile}`);
                return;
            }
        }
        const template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../../resources/views/auth.hbs'), 'utf8'));
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
                    authDescription += util.format('a parameter **`%s`** in the body of the request.', parameterName);
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
    function hasFileBeenModified(filePath) {
        var _a;
        if (!fs.existsSync(filePath)) {
            return false;
        }
        const oldFileHash = (_a = lastKnownFileContentHashes[filePath]) !== null && _a !== void 0 ? _a : null;
        if (oldFileHash) {
            const currentFileHash = hashContent(fs.readFileSync(filePath, 'utf8'));
            const wasFileModifiedManually = currentFileHash != oldFileHash;
            return wasFileModifiedManually;
        }
        return false;
    }
    function writeContentsTrackingFile() {
        let content = "# GENERATED. YOU SHOULDN'T MODIFY OR DELETE THIS FILE.\n";
        content += "# Scribe uses this file to know when you change something manually in your docs.\n";
        content += Object.entries(lastKnownFileContentHashes)
            .map(([filePath, hash]) => `${filePath}=${hash}`).join("\n");
        fs.writeFileSync(trackingFilePath, content);
    }
    function fetchFileHashesFromTrackingFile() {
        if (fs.existsSync(trackingFilePath)) {
            const lastKnownFileHashes = fs.readFileSync(trackingFilePath, "utf8").trim().split("\n");
            // First two lines are comments
            lastKnownFileHashes.shift();
            lastKnownFileHashes.shift();
            lastKnownFileContentHashes = lastKnownFileHashes.reduce(function (all, line) {
                const [filePath, hash] = line.split("=");
                all[filePath] = hash;
                return all;
            }, {});
        }
    }
    return {
        writeIntroAndAuthFiles,
    };
};
//# sourceMappingURL=markdown.js.map