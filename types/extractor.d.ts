import RouteGroupApply = scribe.RouteGroupApply;
import Endpoint = require("./endpoint");
import { scribe } from "../typedefs/core";
declare class Extractor {
    config: scribe.Config;
    router: scribe.SupportedRouters;
    routesToDocument: [scribe.Route, scribe.RouteGroupApply][];
    private serverFile?;
    constructor(config: scribe.Config, router: scribe.SupportedRouters, routesToDocument: [scribe.Route, scribe.RouteGroupApply][], serverFile?: string);
    extract(): Promise<Endpoint[]>;
    iterateOverStrategies(stage: scribe.Stage, strategies: string[], endpoint: Endpoint, rulesToApply: RouteGroupApply): Promise<void>;
    getStrategies(): Record<scribe.Stage, string[]>;
    addAuthField(endpoint: Endpoint): void;
}
export = Extractor;
