"use strict";
const d = require("../../utils/docblocks");
async function run(endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {};
    return docblock.header || {};
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=header_tag.js.map