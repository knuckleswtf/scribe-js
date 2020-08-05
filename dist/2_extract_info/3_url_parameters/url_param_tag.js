"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    return docblock.urlParam || {};
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=url_param_tag.js.map