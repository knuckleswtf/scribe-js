import { scribe } from "../typedefs/core";
declare const _default: {
    writePostmanCollectionFile(config: scribe.Config, groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }): Promise<void>;
    writeOpenAPISpecFile(config: scribe.Config, groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }): Promise<void>;
    writeMarkdownAndHTMLDocs(config: scribe.Config, groupedEndpoints?: {
        [groupName: string]: scribe.Endpoint[];
    }, shouldOverwriteMarkdownFiles?: boolean): Promise<void>;
    /**
     * Transform body parameters such that object fields have a `fields` property containing a list of all subfields
     * Subfields will be removed from the main parameter map
     * For instance, if parameters is {dad: {}, 'dad.cars': {}, 'dad.age': {}},
     * normalise this into {dad: {..., __fields: {'dad.cars': {}, {'dad.age': {}}}
     *
     * @param parameters
     */
    nestArrayAndObjectFields(parameters?: scribe.ParameterBag): Record<string, scribe.Parameter>;
};
export = _default;
