import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Endpoint, config: scribe.Config, routeGroup) {
    return routeGroup.apply.headers || {}
}

export = {
    routers: [],
    run
};