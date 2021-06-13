import { scribe } from "../../typedefs/core";
import DocBlock = scribe.DocBlock;
declare function parseDocBlocksFromFile(file: any): Promise<{
    content: string;
    startsAt: number;
    endsAt: number;
}[]>;
declare function parseDocBlockString(docBlock: string): DocBlock;
declare function getDocBlockForEndpoint(endpoint: scribe.Route): Promise<DocBlock | {}>;
declare const _default: {
    parseDocBlocksFromFile: typeof parseDocBlocksFromFile;
    parseDocBlockString: typeof parseDocBlockString;
    getDocBlockForEndpoint: typeof getDocBlockForEndpoint;
};
export = _default;
