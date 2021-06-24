'use strict';
const fs = require("fs");
const path = require("path");
const tools = require("../tools");
const util = require("util");
const writing = require("../utils/writing");
function hashContent(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest("hex");
}
module.exports = (config, outputPath = '.scribe', preserveUserChanges = true) => {
    const trackingFilePath = path.resolve(path.join(outputPath, '/.filehashes'));
    let lastKnownFileContentHashes = {};
    async function writeIntroAndAuthFiles() {
        !fs.existsSync(outputPath) && fs.mkdirSync(outputPath, { recursive: true });
        fetchFileHashesFromTrackingFile();
        await Promise.all([
            writeIntroMarkdownFile(),
            writeAuthMarkdownFile(),
        ]);
        writeContentsTrackingFile();
    }
    function writeFile(filePath, content) {
        fs.writeFileSync(filePath, content);
        lastKnownFileContentHashes[filePath] = hashContent(content);
    }
    async function writeIntroMarkdownFile() {
        const introMarkdownFile = outputPath + '/intro.md';
        if (hasFileBeenModified(introMarkdownFile)) {
            if (!preserveUserChanges) {
                tools.warn(`Discarding manual changes for file ${introMarkdownFile} because you specified --force`);
            }
            else {
                tools.warn(`Skipping modified file ${introMarkdownFile}`);
                return;
            }
        }
        const markdown = await writing.renderEjsTemplate('markdown/intro', {
            description: config.description,
            introText: config.introText,
            baseUrl: config.baseUrl.replace(/\/$/, ''),
        });
        writeFile(introMarkdownFile, markdown);
    }
    async function writeAuthMarkdownFile() {
        const authMarkdownFile = outputPath + '/auth.md';
        if (hasFileBeenModified(authMarkdownFile)) {
            if (!preserveUserChanges) {
                tools.warn(`Discarding manual changes for file ${authMarkdownFile} because you specified --force`);
            }
            else {
                tools.warn(`Skipping modified file ${authMarkdownFile}`);
                return;
            }
        }
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
        const markdown = await writing.renderEjsTemplate('markdown/auth', {
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