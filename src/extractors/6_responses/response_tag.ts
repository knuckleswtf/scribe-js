import Endpoint from "../../camel/Endpoint";
const { prettyPrintResponseIfJson } = require("../../utils/parameters")

async function run(endpoint: Endpoint, config) {
    const responses = [];

    for (let t of endpoint.docblock.response || []) {
        responses.push({
            content: prettyPrintResponseIfJson(t.content),
            status: Number(t.status),
            description: t.scenario ? `${t.status}, ${t.scenario}` : `${t.status}`,
        });
    }

    return responses;
}

export = {
    routers: [],
    run
};