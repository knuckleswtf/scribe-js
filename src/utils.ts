import {scribe} from "../typedefs/core";

function isPortTaken(host) {
    // Based on https://gist.github.com/timoxley/1689041
    const net = require('net');

    return new Promise((resolve, reject) => {
        const testServer = net.createServer()
            .once('error', function(err) {
                if (err.code === 'EADDRINUSE') return resolve(true);
                return reject(err);
            })
            .once('listening', function() {
                testServer.close();
                return resolve(false);
            })
            .listen(host);
    });
}

function getParameterExample(type = 'string', regex: string = null) {
    const RandExp = require('randexp');
    const faker = require('faker');
    if (!regex) {
        return faker.lorem.word();
    }

    const randexp = new RandExp(regex);
    randexp.max = 2;
    return randexp.gen();
}

function removeEmptyOptionalParametersAndTransformToKeyValue(parameters: scribe.ParameterBag = {}) {
    const cleanParameters = {};
    for (let [name, parameter] of Object.entries(parameters)) {
        if (parameter.value === null && !parameter.required) {
            continue;
        }
        cleanParameters[name] = parameter.value;
    }
    return cleanParameters;
}

export = { isPortTaken, getParameterExample, removeEmptyOptionalParametersAndTransformToKeyValue };