"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    return docblock.responseField || {};
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=responsefield_tag.js.map