import {scribe} from "../../../typedefs/core";
import Endpoint from "../../camel/Endpoint";

async function run(endpoint: Endpoint, config: scribe.Config, routeGroupApply: scribe.RouteGroupApply) {
    return routeGroupApply.headers || {}
}

export = {
    routers: [],
    run
};