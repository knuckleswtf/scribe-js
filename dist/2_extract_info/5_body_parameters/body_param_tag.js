"use strict";
async function run(endpoint, config) {
    const docblock = endpoint.docblock;
    return Object.fromEntries(Object.values(docblock.bodyParam).map(p => {
        return [p.name, p];
    }));
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=body_param_tag.js.map