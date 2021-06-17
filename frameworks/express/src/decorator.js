'use strict';

const trim = require('lodash.trim');
const rtrim = require('lodash.trimend');

module.exports = decorator;

function decorator() {
    if (!process.env.SCRIBE_GENERATE) {
        return;
    }

    decorateExpress();
}

decorator.decorated = false;
decorator.subApps = new Map();
decorator.subRouters = new Map();

const httpMethods = ['get', 'post', 'put', 'patch', 'head', 'delete'];

function decorateExpress() {
    const hook = require('require-in-the-middle');
    const shimmer = require('shimmer');

    hook(['express'], function (exports, name, basedir) {
        if (decorator.decorated) {
            return exports;
        }

        httpMethods.forEach(function(httpMethod) {
            shimmer.wrap(exports.application, httpMethod, original => {
                return patchHttpVerbMethod(original, 'app', httpMethod);
            });

            shimmer.wrap(exports.Router, httpMethod, original => {
                return patchHttpVerbMethod(original, 'router', httpMethod);
            });

            shimmer.wrap(exports.Route.prototype, httpMethod, original => {
                return patchHttpVerbMethod(original, 'route', httpMethod);
            });
        });

        // Handle sub-routers and sub-apps (ie app.use('/path', routerOrApp);
        shimmer.wrap(exports.application, 'use', original => {
            return patchAppUseMethod(original);
        });

        // Handle app.route(path).get()
        shimmer.wrap(exports.Router, 'route', original => {
            return function (...args) {
                const routeObject = original.apply(this, args);
                routeObject.___router = this;
                return routeObject;
            }
        });

        decorator.decorated = true;
        return exports;
    });
}

function getFrameAtCallSite() {
    const stackTrace = new Error().stack;
    const frames = stackTrace.split("\n");

    frames.shift();
    while (frames[0].includes("decorator.js")) {
        frames.shift();
    }

    return frames[0];
}

function getFilePathAndLineNumberFromCallStackFrame(callStackFrame) {
    const [filePath, lineNumber, characterNumber]
        // Split by a colon followed by a number (file paths may have colons)
        = callStackFrame.replace(/.+\(|\)/g, '').split(/:(?=\d)/);
    return {filePath, lineNumber};
}

function addRouteToExpressApp(app, details) {
    let routesOnThisApp = decorator.subApps.get(app);
    if (!Array.isArray(routesOnThisApp)) {
        decorator.subApps.set(app, []);
        routesOnThisApp = [];
    }

    routesOnThisApp.push(details);
    decorator.subApps.set(app, routesOnThisApp);
}

function addRouteToExpressRouter(router, details) {
    let routesOnThisRouter = decorator.subRouters.get(router);
    if (!Array.isArray(routesOnThisRouter)) {
        decorator.subRouters.set(router, []);
        routesOnThisRouter = [];
    }

    routesOnThisRouter.push(details);
    decorator.subRouters.set(router, routesOnThisRouter);
}

function patchAppUseMethod(originalMethod) {
    return function (...args) {
        const returnVal = originalMethod.apply(this, args);

        if (args.length < 2 || typeof args[0] != 'string'
            || typeof args[args.length - 1] !== 'function' || !('get' in args[args.length - 1])) {
            return returnVal;
        }

        const routerOrApp = args[args.length - 1];
        const isApp = '_router' in routerOrApp;
        const routes = decorator[isApp ? 'subApps' : 'subRouters'].get(routerOrApp);
        routes.forEach((r) => {
            r.uri = rtrim(args[0], '/') + '/' + trim(r.uri, '/');
            addRouteToExpressApp(this, r);
        });
        decorator[isApp ? 'subApps' : 'subRouters'].delete(routerOrApp);

        return returnVal;
    };
}

function patchHttpVerbMethod(originalMethod, type, method) {
    return function (...args) {
        const returnVal = originalMethod.apply(this, args);

        if (type == 'route') {
            const router = this.___router;

            let frameAtCallSite = getFrameAtCallSite();
            const {filePath, lineNumber} = getFilePathAndLineNumberFromCallStackFrame(frameAtCallSite);
            const route = {
                methods: Object.keys(this.methods).map(m => m.toUpperCase()),
                uri: this.path,
                declaredAt: [filePath, lineNumber],
                handler: args[args.length - 1]
            };
            addRouteToExpressRouter(router, route);

            return returnVal;
        }

        if (args.length < 2 || typeof args[0] != 'string'
            || typeof args[args.length - 1] !== 'function') {
            return returnVal;
        }

        let frameAtCallSite = getFrameAtCallSite();
        const {filePath, lineNumber} = getFilePathAndLineNumberFromCallStackFrame(frameAtCallSite);
        const route = {
            methods: [method.toUpperCase()],
            uri: args[0],
            declaredAt: [filePath, lineNumber],
            handler: args[args.length - 1]
        };
        type === 'app' ? addRouteToExpressApp(this, route) : addRouteToExpressRouter(this, route);

        return returnVal;
    };
}