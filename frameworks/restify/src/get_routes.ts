import {restify} from "../restify";
import {scribe} from "@knuckleswtf/scribe";

function getRoutesFromRouter(router: restify.DecoratedRouter, basePath = ''): scribe.Endpoint[] {
    return Object.entries(router._registry._routes).map(function mapRouteToEndpointObject([name, details]): scribe.Endpoint {
        return {
            uri: details.path,
            methods: [details.method],
            declaredAt: router._scribe.handlers[details.method.toLowerCase() + " " + details.path] ?? [],
            handler: null,
            _restify: details,
        };
    });
}

export = (app) => {
    return getRoutesFromRouter(app.router);
};