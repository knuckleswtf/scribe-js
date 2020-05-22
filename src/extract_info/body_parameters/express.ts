import {express} from "../../../typedefs/express";
import {endpoint} from "../../../typedefs/core";
const faker = require('faker');

function getBodyParams(handler: Function): endpoint.BodyParameter[] {
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

export = (endpoint: endpoint.Endpoint, config) => {
    return getBodyParams(endpoint.route.stack[0].handle);
};