"use strict";
const d = require("../../utils/docblocks");
async function run(endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {};
    return docblock.urlParam || {};
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=url_param_tag.js.map