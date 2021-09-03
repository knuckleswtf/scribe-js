import {scribe} from "../../../typedefs/core";
import Endpoint from "../../camel/Endpoint";
import fs = require("fs");
import path = require("path");

const { prettyPrintResponseIfJson } = require("../../utils/parameters");

async function run(endpoint: Endpoint, config: scribe.Config) {
    const responses = [];

    for (let t of endpoint.docblock.responseFile || []) {
        let resolvedFilePath = path.resolve(t.filePath);
        if (!fs.existsSync(resolvedFilePath)) {
            throw new Error(`@responseFile ${resolvedFilePath} does not exist`);
        }

        let content = fs.readFileSync(resolvedFilePath, "utf8");
        if (t.extraJson) {
            const extraJson = t.extraJson.replace("'", '"');
            content = JSON.stringify(Object.assign(JSON.parse(content), JSON.parse(extraJson)));
        }

        responses.push({
            content: prettyPrintResponseIfJson(content),
            status: Number(t.status),
            description: t.scenario ? `${t.status}, ${t.scenario}` : `${t.status}`,
        });
    }

    return responses;
}

export = {
    routers: [],
    run
};