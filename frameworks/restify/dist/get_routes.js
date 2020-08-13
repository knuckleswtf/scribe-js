"use strict";
function getRoutesFromRouter(router, basePath = '') {
    return Object.entries(router._registry._routes).map(function mapRouteToEndpointObject([name, details]) {
        var _a;
        return {
            uri: details.path,
            methods: [details.method],
            declaredAt: (_a = router._scribe.handlers[details.method.toLowerCase() + " " + details.path]) !== null && _a !== void 0 ? _a : [],
            handler: null,
            _restify: details,
        };
    });
}
module.exports = (app) => {
    return getRoutesFromRouter(app.router);
};
//# sourceMappingURL=get_routes.js.map