import {scribe} from "../../../typedefs/core";
import d = require("../../utils/docblocks");

async function run(endpoint: scribe.Endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {} as scribe.DocBlock;

    return docblock.responseField || {};
}

export = {
    routers: [],
    run
};