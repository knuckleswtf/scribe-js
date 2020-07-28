"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const methods = ['get', 'post', 'put', 'patch', 'head', 'delete', 'all'];
module.exports = function (app) {
    app._decoratedByScribe = true;
    const router = getRouter();
    (router == 'express') && expressDecorate(app);
};
function getRouter() {
    const pkgJson = require(path.resolve('package.json'));
    if ('express' in pkgJson.dependencies) {
        return 'express';
    }
    return '';
}
function expressDecorate(app) {
    methods.forEach(function decorateRouterMethodWithStackTraceCapturer(method) {
        const original = app[method].bind(app);
        app[method] = function (...args) {
            const stackTrace = new Error().stack;
            const frames = stackTrace.split("\n");
            frames.shift();
            let frameAtCallSite = frames[1];
            if (frameAtCallSite.includes('node_modules')) {
                return original(...args);
            }
            frameAtCallSite = frames[1].replace(/.+\(|\)/g, '');
            const [filePath, lineNumber, characterNumber] = frameAtCallSite.split(/:(?=\d)/); // any colon followed by a number. This is important bc file paths may have colons
            const returned = original(...args);
            if (!app._router._scribe) {
                app._router._scribe = { handlers: {} };
            }
            app._router._scribe.handlers[args[0]] = [filePath, lineNumber];
            return returned;
        };
    });
}
//# sourceMappingURL=decorator.js.map