import Endpoint from "./Endpoint";
import OutputEndpointData = require("./OutputEndpointData");
declare type Group = {
    name: string;
    description?: string;
    endpoints: Endpoint[] | OutputEndpointData[];
};
declare type OutputGroup = {
    name: string;
    description?: string;
    fileName?: string;
    endpoints: OutputEndpointData[];
};
declare const _default: {
    camelDir: ".scribe/endpoints";
    cacheDir: ".scribe/endpoints.cache";
    groupFileNames: {};
    writeEndpointsToDisk(groupedEndpoints: Group[]): Promise<void>;
    groupEndpoints(parsedEndpoints: Endpoint[], endpointGroupIndexes: Record<string, number>): Group[];
    writeExampleCustomEndpoint(): void;
    prepareGroupedEndpointsForOutput(groupedEndpoints: Group[]): OutputGroup[];
    loadEndpointsIntoGroups(folder: string): OutputGroup[];
    loadUserDefinedEndpoints(folder: string): Endpoint[];
    /**
     * Load endpoints from the Camel files into a flat list of plain endpoint objects
     */
    loadEndpointsToFlatPrimitivesArray(folder: string, isFromCache?: boolean): Endpoint[];
    getEndpointIndexInGroup(groups: OutputGroup[], endpoint: Endpoint): number;
};
export = _default;
