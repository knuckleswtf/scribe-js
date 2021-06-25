"use strict";
const utils = require("../../utils/parameters");
const { getParameterExample } = utils;
function run(endpoint) {
    const handler = endpoint.handler;
    if (typeof handler != 'function') {
        return {};
    }
    const functionSourceCode = handler.toString();
    const bodyParamAccesses = functionSourceCode.match(/req\.body\.\w+/g);
    if (!bodyParamAccesses) {
        return {};
    }
    return bodyParamAccesses.reduce((allParams, access) => {
        const name = access.replace('req.body.', '');
        allParams[name] = {
            name,
            type: 'string',
            example: getParameterExample('string'),
            required: true,
            description: '',
        };
        return allParams;
    }, {});
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=read_source_code.js.map