"use strict";
const findLastIndex = require('lodash.findlastindex');
function getRoutesFromRouter(router, basePath = '') {
    const routes = router.stack.map(function (layer) {
        if (layer.route && typeof layer.route.path === 'string') {
            return {
                uri: basePath + layer.route.path,
                handle: layer.route.stack[0].handle,
                route: layer.route,
            };
        }
        if (layer.name === 'router') { // Nested routers
            const basePath = expressRegexpToPath(layer.regexp);
            return getRoutesFromRouter(layer.handle, basePath);
        }
    })
        .filter(route => route)
        .reduce((allRoutes, route) => allRoutes.concat(route), [])
        .filter(function (routeHandler, i, allRoutes) {
        return findLastIndex(allRoutes, (r) => (r.route.stack[0].method == routeHandler.route.stack[0].method) && r.uri === routeHandler.uri) === i;
    });
    return routes;
}
function expressRegexpToPath(regex) {
    if (regex.fast_slash) {
        return '';
    }
    else {
        var match = regex.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
        return match[1].replace(/\\(.)/g, '$1');
    }
}
module.exports = (app) => {
    // console.log(app);
    return getRoutesFromRouter(app._router);
};
//# sourceMappingURL=express.js.map