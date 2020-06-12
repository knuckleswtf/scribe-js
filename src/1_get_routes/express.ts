import {express} from "../../typedefs/express";
import {scribe} from "../../typedefs/core";

const findLastIndex = require('lodash.findlastindex');

function getRoutesFromRouter(router: express.Router, basePath = ''): scribe.Endpoint[] {
    const endpoints = router.stack.map(function mapRouteToEndpointObject(layer): scribe.Endpoint|scribe.Endpoint[] {
        if (layer.route && typeof layer.route.path === 'string') {
            return {
                uri: basePath + layer.route.path,
                handler: layer.route.stack[0].handle,
                route: layer.route,
                methods: Object.keys(layer.route.methods).map(method => method.toUpperCase())
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
                (e: scribe.Endpoint) => {
                    return (e.route.stack[0].method == routeHandler.route.stack[0].method) && (e.uri === routeHandler.uri);
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
    // console.log(app);
    return getRoutesFromRouter(app._router);
};