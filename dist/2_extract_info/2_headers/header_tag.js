"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    return docblock.header || {};
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=header_tag.js.map