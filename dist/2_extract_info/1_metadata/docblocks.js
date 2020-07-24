"use strict";
const d = require("../../utils/docblocks");
async function run(endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {};
    return {
        // @ts-ignore
        groupName: docblock.group || config.defaultGroup,
        // @ts-ignore
        groupDescription: docblock.groupDescription,
        // @ts-ignore
        title: docblock.title,
        // @ts-ignore
        description: docblock.description,
        // @ts-ignore
        authenticated: docblock.authenticated,
    };
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=docblocks.js.map