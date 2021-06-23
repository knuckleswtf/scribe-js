'use strict';

const trim = require('lodash.trim');
const rtrim = require('lodash.trimend');
const tools = require("@knuckleswtf/scribe/dist/tools");

module.exports = decorator;

function decorator() {
    if (!process.env.SCRIBE_GENERATE) {
        return;
    }

    decorateExpress();
}

decorator.decorated = false;
decorator.subRouters = new Map();

const httpMethods = ['get', 'post', 'put', 'patch', 'head', 'delete'];

function decorateExpress() {
    const hook = require('require-in-the-middle');
    const shimmer = require('shimmer');

    hook(['express'], function (exports, name, basedir) {
        if (decorator.decorated) {
            return exports;
        }

        httpMethods.forEach(function shimHttpMethod(httpMethod) {
            shimmer.wrap(exports.Route.prototype, httpMethod, original => {
                return patchHttpVerbMethod(original, httpMethod);
            });
        });

        // Handle sub-routers and sub-apps (ie app.use('/path', routerOrApp);
        shimmer.wrap(exports.application, 'use', patchAppUseMethod);

        shimmer.wrap(exports.Router, 'use', patchRouterUseMethod);

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
    return function use(...args) {
        const returnVal = originalMethod.apply(this, args);
        const routerOrApp = args[args.length - 1];

        if (args.length < 2 || typeof args[0] != 'string'
            || typeof routerOrApp !== 'function' || !('handle' in routerOrApp)) {
            return returnVal;
        }

        const isApp = '_router' in routerOrApp;
        const routes = decorator.subRouters.get(isApp ? routerOrApp._router : routerOrApp);
        routes.forEach((r) => {
            r.uri = rtrim(args[0], '/') + '/' + trim(r.uri, '/');
            addRouteToExpressRouter(this._router, r);
        });
        decorator.subRouters.delete(isApp ? routerOrApp._router : routerOrApp);

        return returnVal;
    };
}


function patchRouterUseMethod(originalMethod) {
    return function use(...args) {
        const returnVal = originalMethod.apply(this, args);

        let frameAtCallSite = tools.getFrameAtCallSite();
        const insideAppDotUse = frameAtCallSite.includes("Array.forEach");
        if (insideAppDotUse) {
            // app.use() calls router.use(),
            // but not with the original args, so we can't access them
            // Instead, the instrumentation is handled from our patched app.use()
            return returnVal;
        }

        const routerOrApp = args[args.length - 1];
        if (args.length < 2 || typeof args[0] != 'string'
            || typeof routerOrApp !== 'function' || !('handle' in routerOrApp)) {
            return returnVal;
        }

        const isApp = '_router' in routerOrApp;
        const routes = decorator.subRouters.get(isApp ? routerOrApp._router : routerOrApp);
        routes.forEach((r) => {
            r.uri = rtrim(args[0], '/') + '/' + trim(r.uri, '/');
            addRouteToExpressRouter(this, r);
        });
        decorator.subRouters.delete(isApp ? routerOrApp._router : routerOrApp);

        return returnVal;
    };
}

function patchHttpVerbMethod(originalMethod, method) {
    return function (...args) {
        const returnVal = originalMethod.apply(this, args);

        const router = this.___router; // Set by the patched ".route" method

        let frameAtCallSite = tools.getFrameAtCallSite();
        const {filePath, lineNumber} = tools.getFilePathAndLineNumberFromCallStackFrame(frameAtCallSite);
        const route = {
            httpMethods: [method.toUpperCase()],
            uri: this.path,
            declaredAt: [filePath, lineNumber],
            handler: args[args.length - 1]
        };
        addRouteToExpressRouter(router, route);

        return returnVal;
    };
}