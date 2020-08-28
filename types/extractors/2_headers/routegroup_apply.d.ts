import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Endpoint, config: scribe.Config, routeGroup: scribe.RouteGroup): Promise<Record<string, any>>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
