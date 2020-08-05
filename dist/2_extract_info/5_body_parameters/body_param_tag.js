"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    return docblock.bodyParam || {};
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=body_param_tag.js.map