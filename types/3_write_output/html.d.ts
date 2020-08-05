import { scribe } from "../../typedefs/core";
declare const _default: {
    writeIndexMarkdownFile: typeof writeIndexMarkdownFile;
    writeAuthMarkdownFile: typeof writeAuthMarkdownFile;
    writeGroupMarkdownFiles: typeof writeGroupMarkdownFiles;
};
export = _default;
declare function writeIndexMarkdownFile(config: scribe.Config, sourceOutputPath: string): void;
declare function writeAuthMarkdownFile(config: scribe.Config, sourceOutputPath: string): void;
declare function writeGroupMarkdownFiles(groupedEndpoints: {
    [groupName: string]: scribe.Endpoint[];
}, config: scribe.Config, sourceOutputPath: string): void;
