import { express } from "./express";
export declare namespace scribe {
    interface ResponseField {
        description: string;
        type: 'string';
    }
    interface Parameter {
        name: string;
        description: string;
        required: boolean;
        value: any;
    }
    interface BodyParameter extends Parameter {
        type: 'string' | 'integer' | 'number';
    }
    type QueryParameter = Parameter;
    interface UrlParameter extends Parameter {
        match: string | RegExp;
        placeholder?: string;
    }
    interface Metadata {
        groupName?: string;
        groupDescription?: string;
        title?: string;
        description?: string;
        authenticated?: boolean;
    }
    type Headers = Record<string, string>;
    type ParameterBag<T extends Parameter = Parameter> = Record<string, T>;
    type UrlParameters = ParameterBag<UrlParameter>;
    type QueryParameters = ParameterBag<QueryParameter>;
    type BodyParameters = ParameterBag<BodyParameter>;
    type ResponseFields = Record<string, ResponseField>;
    interface Response {
        status: number;
        description?: string;
        content: string;
    }
    interface Endpoint {
        uri: string;
        boundUri?: string;
        methods: string[];
        metadata?: Metadata;
        headers?: Headers;
        urlParameters?: UrlParameters;
        queryParameters?: QueryParameters;
        bodyParameters?: BodyParameters;
        cleanQueryParameters?: Record<string, any>;
        cleanBodyParameters?: Record<string, any>;
        fileParameters?: Record<string, any>;
        responses?: Response[];
        responseFields?: ResponseFields;
        route: express.Route;
        handler: Function;
    }
    type SupportedRouters = 'express';
    type Stage = 'metadata' | 'headers' | 'urlParameters' | 'queryParameters' | 'bodyParameters' | 'responses' | 'responseFields';
    interface Config {
        baseUrl: string;
        static: {
            outputPath: string;
        };
        title: string;
        logo: false | string;
        router: SupportedRouters;
        auth: {
            enabled: boolean;
            in: 'query' | 'body' | 'bearer' | 'basic' | 'header';
            name: string;
            useValue: any;
            extraInfo: string;
        };
        routes: [{
            include: string[];
            exclude: string[];
        }];
        exampleLanguages: string[];
        defaultGroup: string;
        introText: string;
        strategies: {
            [stage in Stage]: Strategy[];
        };
    }
    class Strategy {
        routers: SupportedRouters[] | null;
        run: (endpoint: Endpoint, config: Config) => any;
    }
    class MetadataStrategy extends Strategy {
        run(endpoint: Endpoint, config: Config): Metadata;
    }
    class HeadersStrategy extends Strategy {
        run(endpoint: Endpoint, config: Config): Headers;
    }
    class UrlParametersStrategy extends Strategy {
        run(endpoint: Endpoint, config: Config): UrlParameter[];
    }
    class QueryParametersStrategy extends Strategy {
        run(endpoint: Endpoint, config: Config): QueryParameter[];
    }
    class BodyParametersStrategy extends Strategy {
        run(endpoint: Endpoint, config: Config): BodyParameter[];
    }
    class ResponsesStrategy extends Strategy {
        run(endpoint: Endpoint, config: Config): Response[];
    }
    class ResponseFieldsStrategy extends Strategy {
        run(endpoint: Endpoint, config: Config): ResponseField[];
    }
}
