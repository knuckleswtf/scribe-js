import { scribe } from "../typedefs/core";
import Endpoint = require("./camel/Endpoint");
declare type StrategyReturnTypes = scribe.Metadata | scribe.Headers | scribe.UrlParameters | scribe.QueryParameters | scribe.BodyParameters | scribe.Response[] | scribe.ResponseFields;
declare class Strategy<T extends StrategyReturnTypes> {
    private config;
    private routers?;
    constructor(config: scribe.Config);
    shouldRun(endpoint: Endpoint, routeGroupRules: scribe.RouteGroupApply, currentRouter: scribe.SupportedRouters): boolean;
    invoke(endpoint: Endpoint, routeGroupRules: scribe.RouteGroupApply, currentRouter: scribe.SupportedRouters): T | Promise<T>;
    private run;
}
export = Strategy;
