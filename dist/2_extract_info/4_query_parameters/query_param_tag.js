"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    return docblock.queryParam || {};
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=query_param_tag.js.map