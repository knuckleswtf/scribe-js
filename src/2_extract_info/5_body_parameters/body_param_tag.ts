import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Endpoint, config) {
    const docblock = endpoint.docblock;

    return Object.fromEntries(Object.values(docblock.bodyParam).map(p => {
        return [p.name, p];
    }));
}

export = {
    routers: [],
    run
};