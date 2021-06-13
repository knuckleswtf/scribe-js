import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Route, config) {
    const docblock = endpoint.docblock;

    return docblock.response || [];
}

export = {
    routers: [],
    run
};