const {getParameterExample} = require("@knuckleswtf/scribe/dist/utils/parameters");
const trim = require('lodash.trim');
const keyBy = require('lodash.keyby');
const debug = require('debug')('lib:scribe:restify:urlparams');

function run(endpoint, config) {
    let uri = endpoint.uri;
    let matches = uri.match(/:\w+\??(\(.+?\))?/g);
    if (matches === null) {
        return {};
    }

    const urlParameters = matches.map((match) => {
        debug(`Processing Restify URL parameter ` + match);
        let parameter = trim(match, ':');

        const isOptional = parameter.endsWith('?');
        isOptional && (parameter = trim(parameter, '?'));

        return {
            name: parameter,
            value: isOptional ? null : getParameterExample(),
            required: !isOptional,
            type: 'string',
            description: '',
            match,
        };
    });

    return keyBy(urlParameters, 'name');
}

module.exports = {
    routers: ['restify'],
    run
};