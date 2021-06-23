import {scribe} from "../../../typedefs/core";
import Endpoint from "../../camel/Endpoint";

async function run(endpoint: Endpoint, config: scribe.Config,) {
    const docblock = endpoint.docblock;

    return docblock.header || {};
}

export = {
    routers: [],
    run
};