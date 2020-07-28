import {scribe} from "../../../typedefs/core";
import d = require("../../utils/docblocks");

async function run(endpoint: scribe.Endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {} as scribe.DocBlock;

    return docblock.urlParam || {};
}

export = {
    routers: [],
    run
};