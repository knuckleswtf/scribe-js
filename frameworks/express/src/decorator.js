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

        httpMethods.forEach(function (httpMethod) {
            shimmer.wrap(exports.Route.prototype, httpMethod, original => {
                return patchHttpVerbMethod(original, httpMethod);
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
        const routes = decorator.subRouters.get(isApp ? routerOrApp._router : routerOrApp);
        routes.forEach((r) => {
            r.uri = rtrim(args[0], '/') + '/' + trim(r.uri, '/');
            addRouteToExpressApp(this, r);
        });
        decorator.subRouters.delete(isApp ? routerOrApp._router : routerOrApp);

        return returnVal;
    };
}

function patchHttpVerbMethod(originalMethod) {
    return function (...args) {
        const returnVal = originalMethod.apply(this, args);

        const router = this.___router;

        let frameAtCallSite = tools.getFrameAtCallSite();
        const {filePath, lineNumber} = tools.getFilePathAndLineNumberFromCallStackFrame(frameAtCallSite);
        const route = {
            methods: Object.keys(this.methods).map(m => m.toUpperCase()),
            uri: this.path,
            declaredAt: [filePath, lineNumber],
            handler: args[args.length - 1]
        };
        addRouteToExpressRouter(router, route);

        return returnVal;
    };
}