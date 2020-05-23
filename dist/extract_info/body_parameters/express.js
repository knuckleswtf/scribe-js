"use strict";
const faker = require('faker');
function getBodyParams(handler) {
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
module.exports = (endpoint, config) => {
    return getBodyParams(endpoint.route.stack[0].handle);
};
//# sourceMappingURL=express.js.map