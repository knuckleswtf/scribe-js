'use strict';

import {scribe} from "../typedefs/core";
import Endpoint = require("./endpoint");

type StrategyReturnTypes =
    scribe.Metadata
    | scribe.Headers
    | scribe.UrlParameters
    | scribe.QueryParameters
    | scribe.BodyParameters
    | scribe.Response[]
    | scribe.ResponseFields;

class Strategy<T extends StrategyReturnTypes> {
    private routers?: scribe.SupportedRouters[] = null;

    constructor(private config: scribe.Config) {
    }

    shouldRun(endpoint: Endpoint, routeGroupRules: scribe.RouteGroupApply, currentRouter: scribe.SupportedRouters): boolean {
        if (this.routers == null || this.routers.length == 0) {
            return true;
        }

        return this.routers.includes(currentRouter);
    }

    invoke(endpoint: Endpoint, routeGroupRules: scribe.RouteGroupApply, currentRouter: scribe.SupportedRouters): T | Promise<T> {
        if (this.shouldRun(endpoint, routeGroupRules, currentRouter)) {
            return this.run(endpoint, routeGroupRules, currentRouter);
        }

        return null;
    }

    private run(endpoint: Endpoint, routeGroupRules: scribe.RouteGroupApply, currentRouter: scribe.SupportedRouters): T | Promise<T> {
        return null;
    }
}

export = Strategy;