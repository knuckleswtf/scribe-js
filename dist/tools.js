"use strict";
const fs = require("fs");
const path = require("path");
const readline = require("readline");
let verbose = false;
const inferApiName = () => {
    // Basically ucwords(folderName)
    return path.basename(path.resolve('./')).split(/[-_\s]+/)
        .map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
        .replace(/\bApi\b/, 'API');
};
function generateConfigFile(configFilePath, values, options = { silent: false }) {
    try {
        let title = (values.name || inferApiName()) + ' Documentation';
        let baseUrl = values.baseUrl || 'http://localhost:3000';
        if (!baseUrl.startsWith('http')) {
            baseUrl = 'http://' + baseUrl;
        }
        let responseCallsBaseUrl = "http://localhost:" + (values.localPort || 3000);
        // Doing a string find + replace rather than JSON.stringify because we want to preserve comments
        let fileContents = fs.readFileSync(path.join(__dirname, '../config.js'), 'utf8');
        fileContents = fileContents.replace(/title: "(.+)"/, `title: "${title}"`);
        let occurrence = 0;
        fileContents = fileContents.replace(/baseUrl: "(.+)"/g, () => {
            occurrence++;
            return (occurrence == 2) ? `baseUrl: "${responseCallsBaseUrl}"` : `baseUrl: "${baseUrl}"`;
        });
        fs.writeFileSync(configFilePath, fileContents);
        options.silent || success(`Config file ${configFilePath} created.`);
    }
    catch (e) {
        error(`Failed to create config file ${configFilePath}: ${e.message}`);
        process.exit(1);
    }
}
/**
 * Find first line where a string or regex occurs in a file, without reading the entire file
 * @param filePath
 * @param content
 */
async function searchFileLazily(filePath, content) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let lineNumber = 0;
    for await (const line of rl) {
        lineNumber++;
        if (line.match(content)) {
            return lineNumber;
        }
    }
    return false;
}
const kleur = require('kleur');
if (process.env.NO_ANSI === 'false')
    kleur.enabled = false;
const icons = {
    info: kleur.cyan('ⓘ'),
    success: kleur.green('✔'),
    warn: kleur.yellow('⚠'),
    error: kleur.red('✖'),
    debug: kleur.magenta('⚒')
};
function icon(type) {
    return icons[type];
}
function info(input) {
    if (typeof input === 'object') {
        input = require('util').inspect(input);
    }
    console.log(icon('info') + ' ' + kleur.cyan(input));
}
function warn(input) {
    console.warn(icon('warn') + ' ' + kleur.yellow(input));
}
function success(input) {
    console.log(icon('success') + ' ' + kleur.green(input));
}
function error(input) {
    console.error(icon('error') + ' ' + kleur.red(input));
}
function debug(input) {
    if (verbose) {
        console.log(icon('debug') + ' ' + kleur.magenta(input));
    }
}
function formatErrorMessageForListr(error) {
    if (verbose) {
        return kleur.red(error.stack);
    }
    else {
        return kleur.red(error.message + "\nRun this again with --verbose to see the full stack trace.");
    }
}
function findServerStartCommand() {
    var _a;
    const path = require('path');
    const fs = require('fs');
    // In order:
    // npm start, "main", server.js, index.js, bin/www
    const pkgJson = require(path.join(process.cwd(), 'package.json'));
    const npmStart = (_a = pkgJson === null || pkgJson === void 0 ? void 0 : pkgJson.scripts) === null || _a === void 0 ? void 0 : _a.start;
    if (npmStart) {
        return npmStart;
    }
    const mainFile = pkgJson === null || pkgJson === void 0 ? void 0 : pkgJson.main;
    if (mainFile && fs.existsSync(path.join(process.cwd(), mainFile))) {
        return `node ${mainFile}`;
    }
    const filesToTry = ["server.js", "index.js", "bin/www"];
    for (let fileToTry of filesToTry) {
        if (fs.existsSync(path.join(process.cwd(), fileToTry))) {
            return `node ${fileToTry}`;
        }
    }
    return null;
}
function getFrameAtCallSite(exclude = ["decorator.js"]) {
    const stackTrace = new Error().stack;
    const frames = stackTrace.split("\n");
    frames.shift();
    exclude.push("tools.js", "node_modules");
    while (exclude.some(file => frames[0].includes(file))) {
        frames.shift();
    }
    return frames[0];
}
function getFilePathAndLineNumberFromCallStackFrame(callStackFrame) {
    const [filePath, lineNumber, characterNumber] 
    // Split by a colon followed by a number (file paths may have colons)
    = callStackFrame.replace(/.+\(|\)/g, '').split(/:(?=\d)/);
    return { filePath, lineNumber: Number(lineNumber) };
}
function set(object, path, value) {
    const lodashSet = require("lodash.set");
    // lodash set doesnt work well with paths containing "[]" as a key
    // For now, only handle it in initial position
    if (path.startsWith("[].") && object["[]"] != null) {
        return lodashSet(object["[]"], path.slice(3), value);
    }
    return lodashSet(object, path, value);
}
function setVerbosity(state) {
    verbose = state;
}
function isVerbose() {
    return verbose;
}
const originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
};
function spoofConsoleLogForTask(task) {
    console.error = console.info = console.warn = console.log = (text) => {
        if (task.output == null) {
            task.output = '';
        }
        if (text === undefined) {
            text = '';
        }
        task.output += (text + '\n');
    };
}
function restoreConsoleMethods() {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
}
function checkConfigFile(config) {
    let configObject;
    if (typeof config === 'string') {
        let configFile = path.resolve(config);
        if (!fs.existsSync(configFile)) {
            return null;
        }
        configObject = require(configFile);
    }
    else if (typeof config === 'object' && config !== null) {
        configObject = config;
    }
    else {
        error('Invalid type of config file passed. Expected string or object, got: ' + require('util').inspect(config));
        process.exit(1);
    }
    return configObject;
}
module.exports = {
    generateConfigFile,
    searchFileLazily,
    info,
    warn,
    success,
    error,
    debug,
    inferApiName,
    set,
    findServerStartCommand,
    formatErrorMessageForListr,
    getFrameAtCallSite,
    getFilePathAndLineNumberFromCallStackFrame,
    setVerbosity,
    isVerbose,
    spoofConsoleLogForTask,
    restoreConsoleMethods,
    checkConfigFile,
};
//# sourceMappingURL=tools.js.map