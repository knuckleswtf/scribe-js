import {scribe} from "../../../typedefs/core";
import Endpoint from "../../endpoint";

async function run(endpoint: Endpoint, config: scribe.Config, routeGroupApply: scribe.RouteGroupApply) {
    return routeGroupApply.headers || {}
}

export = {
    routers: [],
    run
};