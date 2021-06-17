const methods = ['get', 'post', 'put', 'patch', 'head', 'del'];

module.exports = decorator;

function decorator(server) {
    if (!process.env.SCRIBE_GENERATE) {
        return;
    }
    decorateRestifyRouter(server);
};

decorator.decorated = false;
decorator.allRoutes = [];

function decorateRestifyRouter(server) {
    const hook = require('require-in-the-middle');
    const shimmer = require('shimmer');

    hook(['restify/lib/router'], function (exports, name, basedir) {
        shimmer.wrap(exports.prototype, 'mount', original => {
            return function (...args) {
                const returned = original.apply(this, args);

                const stackTrace = new Error().stack;
                const frames = stackTrace.split("\n");
                frames.shift();

                let frameAtCallSite = frames[2].replace(/.+\(|\)/g, '');
                const [filePath, lineNumber, characterNumber]
                    = frameAtCallSite.split(/:(?=\d)/);  // any colon followed by a number. This is important bc file paths may have colons

                decorator.allRoutes.push({
                    methods: [args[0].method],
                    handler: args[1][args[1].length - 1],
                    uri: args[0].path,
                    declaredAt: [filePath, lineNumber],
                });

                return returned;
            };
        });

        return exports;
    });

    decorator.decorated = true;
}