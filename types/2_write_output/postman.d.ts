import { scribe } from "../../typedefs/core";
declare const _default: (config: scribe.Config) => {
    writePostmanCollectionFile: (groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }, outputPath: string) => void;
};
export = _default;
