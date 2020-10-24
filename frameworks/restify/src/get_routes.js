/**
 * @typedef {Object} Server
 * @property {'restify'} name
 * @property {boolean} handleUncaughtExceptions
 * @property {string} url
 * @property {DecoratedRouter} router
 */

/**
 * @typedef {Object} Route
 * @property {string} method
 * @property {string} path
 * @property {string} name
 * @property {{ path: string, version: string, method: string },} spec
 * @property {{}} chain
 */

/**
 * @typedef {Object} RouterRegistryRadix
 * @property {Object.<string, Route>} _routes
 */

/**
 * @typedef {Object} Router
 * @property {RouterRegistryRadix} _registry
 */

/**
 * @typedef {Router} DecoratedRouter
 * @property {boolean} _decoratedByScribe
 * @property {{handlers: {}}} _scribe
 */

/**
 * @param {DecoratedRouter} router
 * @param {string} basePath
 * @returns { import("../../../types/index").Endpoint[]}
 */
function getRoutesFromRouter(router, basePath = '') {
    return Object.entries(router._registry._routes).map(function mapRouteToEndpointObject([name, details]) {
        return {
            uri: details.path,
            methods: [details.method],
            declaredAt: router._scribe.handlers[details.method.toLowerCase() + " " + details.path] ?? [],
            handler: null,
            _restify: details,
        };
    });
}

module.exports = (app) => {
    return getRoutesFromRouter(app.router);
};