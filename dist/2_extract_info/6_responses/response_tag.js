"use strict";
const d = require("../../utils/docblocks");
async function run(endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {};
    return docblock.response || [];
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=response_tag.js.map