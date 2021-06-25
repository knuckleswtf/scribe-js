"use strict";
const { getParameterExample, castValueToType } = require("../../utils/parameters");
async function run(endpoint, config) {
    return Object.fromEntries(Object.values(endpoint.docblock.bodyParam || {}).map(p => {
        if (p.example == null && !((p.description || '').includes(' No-example'))) {
            p.example = getParameterExample(p.type);
        }
        p.example = castValueToType(p.example, p.type);
        p.description = (p.description || '').replace(/\s+No-example.?/, '');
        return [p.name, p];
    }));
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=bodyparam_tag.js.map