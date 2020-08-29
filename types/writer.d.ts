import { scribe } from "../typedefs/core";
declare const _default: {
    writePostmanCollectionFile(config: scribe.Config, groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }): Promise<void>;
    writeOpenAPISpecFile(config: scribe.Config, groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }): Promise<void>;
    writeMarkdownAndHTMLDpcs(config: scribe.Config, groupedEndpoints?: {
        [groupName: string]: scribe.Endpoint[];
    }, shouldOverwriteMarkdownFiles?: boolean): Promise<void>;
};
export = _default;
