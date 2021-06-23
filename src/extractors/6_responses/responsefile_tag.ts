import {scribe} from "../../../typedefs/core";
import fs = require("fs");
import path = require("path");
import tools = require('../../tools');
const { prettyPrintResponseIfJson } = require("../../utils/parameters");
import Endpoint from "../../camel/Endpoint";

async function run(endpoint: Endpoint, config: scribe.Config) {
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

export = {
    routers: [],
    run
};