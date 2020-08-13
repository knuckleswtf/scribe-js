import {express} from "../express";
import {scribe} from "@knuckleswtf/scribe";

const findLastIndex = require('lodash.findlastindex');

function getRoutesFromRouter(router: express.DecoratedRouter, basePath = ''): scribe.Endpoint[] {
    const endpoints = router.stack.map(function mapRouteToEndpointObject(layer): scribe.Endpoint|scribe.Endpoint[] {
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
        .reduce<scribe.Endpoint[]>((allRoutes, endpoint) => (allRoutes).concat(endpoint), [])
        .filter(function removeMiddleware(routeHandler, thisIndex, allRoutes) {
            const lastHandlerFunction = findLastIndex(
                allRoutes,
                (currentEndpoint: scribe.Endpoint) => {
                    return (currentEndpoint._express.stack[0].method == routeHandler._express.stack[0].method) && (currentEndpoint.uri === routeHandler.uri);
                });
            return lastHandlerFunction === thisIndex;
        });

    return endpoints;
}

function expressRegexpToPath(regex: express.PathRegExp): string {
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


export = (app) => {
    return getRoutesFromRouter(app._router);
};