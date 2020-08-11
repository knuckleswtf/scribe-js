"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
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