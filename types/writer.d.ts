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
    /**
     * Transform body parameters such that object fields have a `fields` property containing a list of all subfields
     * Subfields will be removed from the main parameter map
     *
     * @param parameters
     */
    nestArrayAndObjectFields(parameters?: scribe.ParameterBag): Record<string, scribe.Parameter & {
        fields?: scribe.Parameter[];
    }>;
};
export = _default;
