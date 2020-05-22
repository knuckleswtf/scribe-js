import {express} from "../../../typedefs/express";
const RandExp = require('randexp');
const faker = require('faker');
const trim = require('lodash.trim');

function getBodyParams(handler: Function) {
    const functionSourceCode = handler.toString();

    const bodyParamAccesses = functionSourceCode.match(/req\.body\.\w+/g);

    if (!bodyParamAccesses) {
        return [];
    }

    console.log(bodyParamAccesses);
    return bodyParamAccesses.map((access) => {
        return {
            name: access.replace('req.body.', ''),
        };
    });

}

export = (route, mainFilePath, config) => {
    return getBodyParams(route.route.stack[0].handle);
};