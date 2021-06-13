import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Route, config: scribe.Config, routeGroup: scribe.RouteGroup) {
    return routeGroup.apply.headers || {}
}

export = {
    routers: [],
    run
};