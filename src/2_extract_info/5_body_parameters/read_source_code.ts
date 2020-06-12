import {scribe} from "../../../typedefs/core";
import Endpoint = scribe.Endpoint;
const faker = require('faker');

function run(endpoint: Endpoint): scribe.BodyParameter[] {
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


export = {
    routers: [],
    run
};