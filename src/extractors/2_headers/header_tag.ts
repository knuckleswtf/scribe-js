import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Route, config: scribe.Config,) {
    const docblock = endpoint.docblock;

    return docblock.header || {};
}

export = {
    routers: [],
    run
};