"use strict";
const faker = require('faker');
function run(endpoint) {
    const handler = endpoint.route.stack[0].handle;
    const functionSourceCode = handler.toString();
    const bodyParamAccesses = functionSourceCode.match(/req\.body\.\w+/g);
    if (!bodyParamAccesses) {
        return [];
    }
    return bodyParamAccesses.map((access) => {
        return {
            name: access.replace('req.body.', ''),
            type: 'string',
            value: faker.lorem.word(),
            required: true,
            description: '',
        };
    });
}
module.exports = {
    routers: [],
    run
};
//# sourceMappingURL=read_source_code.js.map