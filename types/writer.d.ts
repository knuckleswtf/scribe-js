import { scribe } from "../typedefs/core";
import OutputEndpointData from "./camel/OutputEndpointData";
declare class Writer {
    private config;
    constructor(config: scribe.Config);
    writeDocs(groupedEndpoints?: Group[]): Promise<void>;
    writePostmanCollection(groupedEndpoints: Group[]): Promise<void>;
    writeOpenAPISpec(groupedEndpoints: Group[]): Promise<void>;
    writeHTMLDocs(groupedEndpoints: Group[]): Promise<void>;
}
export = Writer;
declare type Group = {
    name: string;
    description?: string;
    fileName?: string;
    endpoints: OutputEndpointData[];
};
