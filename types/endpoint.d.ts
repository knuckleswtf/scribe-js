import { scribe } from "../typedefs/core";
declare class Endpoint {
    uri: string;
    httpMethods: string[];
    metadata: scribe.Metadata;
    headers: scribe.Headers;
    urlParameters: scribe.UrlParameters;
    queryParameters: scribe.QueryParameters;
    bodyParameters: scribe.BodyParameters;
    responses: scribe.Response[];
    responseFields: scribe.ResponseFields;
    docblock: Partial<scribe.DocBlock>;
    originalRoute: any;
    boundUri: string;
    nestedBodyParameters: Record<string, any>;
    /**
     * Authentication info for this endpoint. In the form [{where}, {name}, {sample}]
     * Example: ["queryParameters", "api_key", "njiuyiw97865rfyvgfvb1"]
     */
    auth: [string, string, string];
    cleanQueryParameters: Record<string, any>;
    cleanBodyParameters: Record<string, any>;
    fileParameters: Record<string, any>;
    handler: Function;
    constructor(endpointDetails: scribe.Route);
    add(stage: string, data: any): void;
    setBoundUrl(): void;
    cleanUpUrlParams(): void;
    get endpointId(): string;
    forSerialisation(): this & {
        cleanQueryParameters: any;
        cleanUrlParameters: any;
        fileParameters: any;
        cleanBodyParameters: any;
        docblock: any;
        originalRoute: any;
        auth: any;
    };
}
export = Endpoint;
