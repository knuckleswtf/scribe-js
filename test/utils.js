'use strict';

const set = require('lodash.set');

function mockConfig(options = {}) {
    const config = JSON.parse(JSON.stringify(require('../config.js')));
    // Skip these ones for faster tests
    config.postman.enabled = false;
    config.openapi.enabled = false;
    config.routes[0].apply.responseCalls.methods = [];
    for (let key in options) {
        set(config, key, options[key]);
    }
    return config;
}

module.exports = {
    mockConfig
};