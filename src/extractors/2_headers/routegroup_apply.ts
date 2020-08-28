import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Endpoint, config: scribe.Config, routeGroup: scribe.RouteGroup) {
    return routeGroup.apply.headers || {}
}

export = {
    routers: [],
    run
};