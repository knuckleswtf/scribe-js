import Endpoint from "../../camel/Endpoint";

async function run(endpoint: Endpoint, config) {
    const docblock = endpoint.docblock;

    return docblock.response || [];
}

export = {
    routers: [],
    run
};