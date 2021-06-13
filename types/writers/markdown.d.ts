import { scribe } from "../../typedefs/core";
declare const _default: (config: scribe.Config) => {
    writeDocs: (groupedEndpoints: {
        [groupName: string]: scribe.Route[];
    }, sourceOutputPath: string, shouldOverwriteMarkdownFiles: boolean) => void;
    writeIndexMarkdownFile: (sourceOutputPath: string, shouldOverwriteMarkdownFiles?: boolean) => void;
    writeAuthMarkdownFile: (sourceOutputPath: string, shouldOverwriteMarkdownFiles?: boolean) => void;
    writeGroupMarkdownFiles: (groupedEndpoints: {
        [groupName: string]: scribe.Route[];
    }, sourceOutputPath: string, shouldOverwriteMarkdownFiles?: boolean) => void;
};
export = _default;
