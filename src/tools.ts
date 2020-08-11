import fs = require("fs");
import path = require("path");
import readline = require('readline');


function generateConfigFile(configFilePath, values, options = {silent: false}) {
    // Basically ucwords (folderName)
    const inferApiName = () => path.basename(path.resolve('./')).split(/[-_\s]+/)
        .map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

    try {
        let title = (values.name || inferApiName()) + ' Documentation';
        let baseUrl = values.baseUrl || 'http://localhost:3000';
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

        options.silent || console.log(`✔ Config file ${configFilePath} created.`);
    } catch (e) {
        console.log(`❗ Failed to create config file ${configFilePath}: ${e.message}`);
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

module.exports = {
    generateConfigFile,
    searchFileLazily
};