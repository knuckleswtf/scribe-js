"use strict";
const { prettyPrintResponseIfJson } = require("../../utils/parameters");
async function run(endpoint, config) {
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
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=response_tag.js.map