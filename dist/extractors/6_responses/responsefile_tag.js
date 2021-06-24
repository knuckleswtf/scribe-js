"use strict";
const fs = require("fs");
const path = require("path");
const tools = require("../../tools");
const { prettyPrintResponseIfJson } = require("../../utils/parameters");
async function run(endpoint, config) {
    const responseFileTags = endpoint.docblock.responseFile || [];
    const responses = [];
    for (let t of responseFileTags) {
        let resolvedFilePath = path.resolve(t.filePath);
        if (!fs.existsSync(resolvedFilePath)) {
            tools.warn(`@responseFile ${resolvedFilePath} does not exist`);
            continue;
        }
        let content = fs.readFileSync(resolvedFilePath, "utf8");
        if (t.extraJson) {
            const extraJson = t.extraJson.replace("'", '"');
            content = JSON.stringify(Object.assign(JSON.parse(content), JSON.parse(extraJson)));
        }
        responses.push({
            content: prettyPrintResponseIfJson(content),
            status: Number(t.status),
            description: '',
        });
    }
    return responses;
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=responsefile_tag.js.map