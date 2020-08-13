import {scribe} from "@knuckleswtf/scribe";
import utils = require("@knuckleswtf/scribe/dist/utils/parameters");

const {getParameterExample} = utils;
const trim = require('lodash.trim');
const keyBy = require('lodash.keyby');

function run(endpoint: scribe.Endpoint, config): scribe.UrlParameters {
    let uri = endpoint.uri;
    let matches = uri.match(/:\w+\??(\(.+?\))?/g);
    if (matches === null) {
        return {};
    }

    const urlParameters = matches.map((match): scribe.UrlParameter => {
        let parameter = trim(match, ':');

        const isOptional = parameter.endsWith('?');
        isOptional && (parameter = trim(parameter, '?'));

        return {
            name: parameter,
            value: isOptional ? null : getParameterExample(),
            required: !isOptional,
            description: '',
            match,
        };
    });

    return keyBy(urlParameters, 'name');
}

export = {
    routers: ['restify'],
    run
};