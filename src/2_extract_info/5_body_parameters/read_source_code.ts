import {scribe} from "../../../typedefs/core";
import utils = require("../../utils");
const { getParameterExample } = utils;

const faker = require('faker');

function run(endpoint: scribe.Endpoint): scribe.BodyParameter[] {
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
            value: getParameterExample('string'),
            required: true,
            description: '',
        };
    });
}


export = {
    routers: [],
    run
};