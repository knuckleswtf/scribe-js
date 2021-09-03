import { scribe } from "../../typedefs/core";
import Endpoint from "./Endpoint";
declare class OutputEndpointData {
    uri: string;
    httpMethods: scribe.HttpMethods[];
    metadata: scribe.Metadata;
    headers: scribe.Headers;
    urlParameters: scribe.UrlParameters;
    queryParameters: scribe.QueryParameters;
    bodyParameters: scribe.BodyParameters;
    responses: scribe.Response[];
    responseFields: scribe.ResponseFields;
    boundUri: string;
    nestedBodyParameters: scribe.ParameterBag<scribe.BodyParameter>;
    cleanUrlParameters: Record<string, any>;
    cleanQueryParameters: Record<string, any>;
    cleanBodyParameters: Record<string, any>;
    fileParameters: Record<string, any>;
    constructor(endpoint: Endpoint);
    static fromExtractedEndpointObject(endpoint: Endpoint): OutputEndpointData;
    static getUrlWithBoundParameters(uri: string, urlParameters: scribe.UrlParameters): string;
    get endpointId(): string;
    /**
     * Transform body parameters such that object fields have a `fields` property containing a list of all subfields
     * Subfields will be removed from the main parameter map
     * For instance, if parameters is {dad: {}, 'dad.cars': {}, 'dad.age': {}},
     * normalise this into {dad: {..., __fields: {'dad.cars': {}, {'dad.age': {}}}
     */
    nestArrayAndObjectFields(parameters?: scribe.ParameterBag): scribe.ParameterBag<scribe.Parameter>;
    hasFiles(): boolean;
    isArrayBody(): boolean;
    static getFileParameters(parameters: Record<string, any>): [Record<string, any>, Record<string, any>];
    private normalizeResponses;
}
export = OutputEndpointData;
