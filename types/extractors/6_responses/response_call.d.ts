import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Route, config: scribe.Config, routeGroup: typeof config.routes[0]): Promise<scribe.Response[]>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
