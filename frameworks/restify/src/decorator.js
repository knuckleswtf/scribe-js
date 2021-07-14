'use strict';

const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = decorator;

function decorator() {
    if (!process.env.SCRIBE_GENERATE) {
        return;
    }

    decorateRestifyRouter();
};

decorator.decorated = false;
decorator.allRoutes = [];

function decorateRestifyRouter() {
    const hook = require('require-in-the-middle');
    const shimmer = require('shimmer');

    hook(['restify/lib/router'], function (exports, name, basedir) {
        if (decorator.decorated) {
            return exports;
        }

        shimmer.wrap(exports.prototype, 'mount', original => {
            return function (...args) {
                const returned = original.apply(this, args);

                const stackTrace = new Error().stack;
                const frames = stackTrace.split("\n");
                frames.shift();

                let frameAtCallSite = tools.getFrameAtCallSite();
                const {filePath, lineNumber} = tools.getFilePathAndLineNumberFromCallStackFrame(frameAtCallSite);
                decorator.allRoutes.push({
                    httpMethods: [args[0].method],
                    handler: args[1][args[1].length - 1],
                    uri: args[0].path.replace(/^\/|\/$/, ''), // trim slashes
                    declaredAt: [filePath, lineNumber],
                });

                return returned;
            };
        });

        decorator.decorated = true;
        return exports;
    });
}