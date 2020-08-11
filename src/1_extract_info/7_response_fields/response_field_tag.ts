import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Endpoint, config: scribe.Config) {
    const docblock = endpoint.docblock;

    return docblock.responseField || {};
}

export = {
    routers: [],
    run
};