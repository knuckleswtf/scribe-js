
const methods = ['get', 'post', 'put', 'patch', 'head', 'del'];

module.exports = function (server) {
    server._decoratedByScribe = true;

    decorateRestifyRouter(server);
};

function decorateRestifyRouter(server) {
    methods.forEach(function decorateRouterMethodWithStackTraceCapturer(method) {
        const original = server[method].bind(server);
        server[method] = function (...args) {
            const stackTrace = new Error().stack;
            const frames = stackTrace.split("\n");
            frames.shift();

            let frameAtCallSite = frames[1];

            if (frameAtCallSite.includes('node_modules')) {
                return original(...args);
            }

            frameAtCallSite = frames[1].replace(/.+\(|\)/g, '');
            const [filePath, lineNumber, characterNumber]
                = frameAtCallSite.split(/:(?=\d)/);  // any colon followed by a number. This is important bc file paths may have colons

            const returned = original(...args);

            if (!server.router._scribe) {
                server.router._scribe = {handlers: {}}
            }

            // Restify routes can be defined with an object with path and version
            const path = typeof args[0] == "object" ? args[0].path : args[0];
            server.router._scribe.handlers[method + " " + path] = [filePath, lineNumber];

            return returned;
        };
    });
}