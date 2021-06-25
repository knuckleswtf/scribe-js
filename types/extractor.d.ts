import Endpoint = require("./camel/Endpoint");
import OutputEndpointData = require("./camel/OutputEndpointData");
import RouteGroupApply = scribe.RouteGroupApply;
import { scribe } from "../typedefs/core";
declare class Extractor {
    config: scribe.Config;
    router: scribe.SupportedRouters;
    private serverStartCommand?;
    static encounteredErrors: boolean;
    endpointGroupIndexes: {};
    constructor(config: scribe.Config, router: scribe.SupportedRouters, serverStartCommand?: string);
    extract(routesToDocument: [scribe.Route, scribe.RouteGroupApply][], cachedEndpoints: Endpoint[], latestEndpointsData: Endpoint[], groups: {
        name: string;
        description?: string;
        fileName?: string;
        endpoints: OutputEndpointData[];
    }[]): Promise<Endpoint[]>;
    iterateOverStrategies(stage: scribe.Stage, strategies: string[], endpoint: Endpoint, rulesToApply: RouteGroupApply): Promise<void>;
    getStrategies(): Record<scribe.Stage, string[]>;
    addAuthField(endpoint: Endpoint): void;
    mergeAnyEndpointDataUpdates(endpoint: Endpoint, cachedEndpoints: Endpoint[], latestEndpointsData: Endpoint[], groups: {
        name: string;
        description?: string;
        fileName?: string;
        endpoints: OutputEndpointData[];
    }[]): [Endpoint, number];
}
export = Extractor;
