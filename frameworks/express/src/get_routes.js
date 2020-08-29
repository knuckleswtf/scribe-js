/**
 * @typedef {Function} DecoratedRouter
 * @property {Layer[]} stack
 * @property {{handlers: {}}} _scribe
 */

/**
 * @typedef {Object} Layer
 * @property {DecoratedRouter} handle
 * @property {'router' | 'bound dispatch' | '<anonymous>' | string} name Name of the middleware function
 * @prop {*} params
 * @prop {string} path
 * @property {[]} keys
 * @property {PathRegExp} regexp
 * @property {string} method
 * @prop {Route} route
 */

/**
 * @typedef {RegExp} PathRegExp
 * @prop {boolean} fast_star
 * @prop {boolean} fast_slash
 */

/**
 * @typedef {Object} Route
 * @property {string[]} methods
 * @property {string} path
 * @property {Layer[]} stack
 */

/**
 * @typedef {string | RegExp | (string | RegExp)[]} PathArgument
 */

const findLastIndex = require('lodash.findlastindex');

/**
 * @param {DecoratedRouter} router
 * @param {string} basePath
 * @returns { import("../../../types/index").Endpoint[]}
 */
function getRoutesFromRouter(router, basePath = '') {
    const endpoints = router.stack.map(function mapRouteToEndpointObject(layer) {
        if (layer.route && typeof layer.route.path === 'string') {
            const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase());
            return {
                uri: basePath + layer.route.path,
                handler: layer.route.stack[0].handle,
                _express: layer.route,
                methods,
                declaredAt: router._scribe.handlers[methods[0].toLowerCase() + " " + layer.route.path] ?? [],
            };
        }

        if (layer.name === 'router') {// Nested routers
            const basePath = expressRegexpToPath(layer.regexp);
            return getRoutesFromRouter(layer.handle, basePath);
        }

    })
        .filter(route => route)
        .reduce((allRoutes, endpoint) => (allRoutes).concat(endpoint), [])
        .filter(function removeMiddleware(routeHandler, thisIndex, allRoutes) {
            const lastHandlerFunction = findLastIndex(
                allRoutes,
                /** @type {import("../../../types/index").Endpoint} currentEndpoint */
                (currentEndpoint) => {
                    return (currentEndpoint._express.stack[0].method === routeHandler._express.stack[0].method) && (currentEndpoint.uri === routeHandler.uri);
                });
            return lastHandlerFunction === thisIndex;
        });

    return endpoints;
}

/**
 * @param {PathRegExp} regex
 * @returns {string}
 */
function expressRegexpToPath(regex) {
    if (regex.fast_slash) {
        return '';
    } else {
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