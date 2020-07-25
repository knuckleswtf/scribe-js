"use strict";
const d = require("../../utils/docblocks");
async function run(endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {};
    return {
        groupName: docblock.group || config.defaultGroup,
        groupDescription: docblock.groupDescription,
        title: docblock.title,
        description: docblock.description,
        authenticated: docblock.authenticated,
    };
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=docblocks.js.map