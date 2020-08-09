"use strict";
const { getParameterExample, castValueToType } = require("../../utils/parameters");
async function run(endpoint, config) {
    return Object.fromEntries(Object.values(endpoint.docblock.urlParam).map(p => {
        if (p.value == null) {
            // Set values for only required parameters
            p.value = p.required ? getParameterExample(p.type || 'string') : null;
        }
        p.value = castValueToType(p.value, p.type);
        return [p.name, p];
    }));
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=url_param_tag.js.map