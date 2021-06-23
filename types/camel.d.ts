import { scribe } from "../typedefs/core";
import Endpoint from "./endpoint";
declare type Group = {
    name: string;
    description?: string;
    endpoints: Endpoint[];
};
declare class Camel {
    config: scribe.Config;
    static camelDir: ".scribe/endpoints";
    static cacheDir: ".scribe/endpoints.cache";
    constructor(config: scribe.Config);
    extractAndWriteApiDetailsToDisk(overwriteMarkdownFiles: boolean): Promise<void>;
    writeEndpointsToDisk(groupedEndpoints: Group[]): Promise<void>;
    static groupEndpoints(parsedEndpoints: Endpoint[]): Group[];
    writeExampleCustomEndpoint(): Promise<void>;
    prepareGroupedEndpointsForOutput(groupedEndpoints: Group[]): any[];
}
export = Camel;
