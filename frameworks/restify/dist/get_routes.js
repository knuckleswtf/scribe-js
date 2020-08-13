"use strict";
function getRoutesFromRouter(router, basePath = '') {
    return Object.entries(router._registry._routes).map(function mapRouteToEndpointObject([name, details]) {
        return {
            uri: details.path,
            methods: [details.method],
            declaredAt: [],
            handler: null,
            _restify: details,
        };
    });
}
module.exports = (app) => {
    return getRoutesFromRouter(app.router);
};
//# sourceMappingURL=get_routes.js.map