import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Route, config: scribe.Config) {
    const docblock = endpoint.docblock;

    return docblock.responseField || {};
}

export = {
    routers: [],
    run
};