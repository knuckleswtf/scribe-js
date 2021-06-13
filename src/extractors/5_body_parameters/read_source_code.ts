import {scribe} from "../../../typedefs/core";
import utils = require("../../utils/parameters");

const { getParameterExample } = utils;

function run(endpoint: scribe.Route): scribe.BodyParameters {
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
            value: getParameterExample('string'),
            required: true,
            description: '',
        };
        return allParams;
    }, {});
}


export = {
    routers: [],
    run
};