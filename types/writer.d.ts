import { scribe } from "../typedefs/core";
declare const _default: {
    writePostmanCollectionFile(groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }, config: scribe.Config): void;
    writeMarkdownAndHTMLDpcs(groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }, config: scribe.Config, shouldOverwriteMarkdownFiles?: boolean): Promise<void>;
};
export = _default;
