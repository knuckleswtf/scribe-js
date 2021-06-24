"use strict";
const { getParameterExample, castValueToType } = require("../../utils/parameters");
async function run(endpoint, config) {
    return Object.fromEntries(Object.values(endpoint.docblock.urlParam || {}).map(p => {
        if (p.value == null && !(p.description || '').includes(' No-example')) {
            p.value = getParameterExample(p.type || 'string');
        }
        p.value = castValueToType(p.value, p.type);
        p.description = (p.description || '').replace(/\s+No-example.?/, '');
        return [p.name, p];
    }));
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=urlparam_tag.js.map