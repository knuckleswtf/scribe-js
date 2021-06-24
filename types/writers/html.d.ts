import { scribe } from "../../typedefs/core";
declare class HtmlWriter {
    private config;
    private converter;
    constructor(config: scribe.Config);
    generate(groupedEndpoints: any, sourceFolder?: string, destinationFolder?: string): Promise<void>;
    transformMarkdownFileToHTML(filePath: any): any;
    getMetadata(): {
        title: string;
        exampleLanguages: string[];
        logo: string | false;
        lastUpdated: string;
        auth: any;
        tryItOut: {
            enabled: boolean;
            baseUrl: boolean;
        } | {
            enabled: true;
        };
        links: any[];
    };
}
export = HtmlWriter;
