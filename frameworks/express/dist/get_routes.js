"use strict";
const findLastIndex = require('lodash.findlastindex');
function getRoutesFromRouter(router, basePath = '') {
    const endpoints = router.stack.map(function mapRouteToEndpointObject(layer) {
        var _a;
        if (layer.route && typeof layer.route.path === 'string') {
            return {
                uri: basePath + layer.route.path,
                handler: layer.route.stack[0].handle,
                route: layer.route,
                methods: Object.keys(layer.route.methods).map(method => method.toUpperCase()),
                declaredAt: (_a = router._scribe.handlers[layer.route.path]) !== null && _a !== void 0 ? _a : [],
            };
        }
        if (layer.name === 'router') { // Nested routers
            const basePath = expressRegexpToPath(layer.regexp);
            return getRoutesFromRouter(layer.handle, basePath);
        }
    })
        .filter(route => route)
        .reduce((allRoutes, endpoint) => (allRoutes).concat(endpoint), [])
        .filter(function removeMiddleware(routeHandler, thisIndex, allRoutes) {
        const lastHandlerFunction = findLastIndex(allRoutes, (e) => {
            return (e.route.stack[0].method == routeHandler.route.stack[0].method) && (e.uri === routeHandler.uri);
        });
        return lastHandlerFunction === thisIndex;
    });
    return endpoints;
}
function expressRegexpToPath(regex) {
    if (regex.fast_slash) {
        return '';
    }
    else {
        const match = regex.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
        return match[1].replace(/\\(.)/g, '$1');
    }
}
module.exports = (app) => {
    return getRoutesFromRouter(app._router);
};
//# sourceMappingURL=get_routes.js.map