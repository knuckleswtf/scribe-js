import {express} from "../express";
import {scribe} from "@knuckleswtf/scribe";

function getRoutesFromRouter(router: express.DecoratedRouter, basePath = ''): scribe.Endpoint[] {
    return Object.entries(router._registry._routes).map(function mapRouteToEndpointObject([name, details]): scribe.Endpoint | scribe.Endpoint[] {
        return {
            uri: details.path,
            methods: [details.method],
            declaredAt: [],
            handler: null,
            _restify: details,
        };
    });
}

export = (app) => {
    return getRoutesFromRouter(app.router);
};