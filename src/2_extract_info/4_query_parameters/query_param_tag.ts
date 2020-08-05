import {scribe} from "../../../typedefs/core";
import d = require("../../utils/docblocks");

async function run(endpoint: scribe.Endpoint, config) {
    const docblock = endpoint.docblock;

    return docblock.queryParam || {};
}

export = {
    routers: [],
    run
};