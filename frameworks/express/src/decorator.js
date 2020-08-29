
const methods = ['get', 'post', 'put', 'patch', 'head', 'delete'];

module.exports = function (app) {
    app._decoratedByScribe = true;

    decorateExpressRouter(app);
};

function decorateExpressRouter(app) {
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
            const [filePath, lineNumber, characterNumber]
                = frameAtCallSite.split(/:(?=\d)/);  // any colon followed by a number. This is important bc file paths may have colons

            const returned = original(...args);

            if (!app._router._scribe) {
                app._router._scribe = {handlers: {}}
            }
            app._router._scribe.handlers[method + " " + args[0]] = [filePath, lineNumber];

            return returned;
        };
    });
}