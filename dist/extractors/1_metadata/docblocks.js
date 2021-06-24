"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    let isAuthenticated;
    if (docblock.authenticated) {
        isAuthenticated = true;
    }
    else if (docblock.unauthenticated) {
        isAuthenticated = false;
    }
    else {
        isAuthenticated = config.auth.default || false;
    }
    return {
        groupName: docblock.group || config.defaultGroup,
        groupDescription: docblock.groupDescription,
        title: docblock.title,
        description: docblock.description,
        authenticated: isAuthenticated,
    };
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=docblocks.js.map