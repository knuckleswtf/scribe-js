"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    return docblock.response || [];
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=response_tag.js.map