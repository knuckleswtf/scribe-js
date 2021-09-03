export declare namespace scribe {

    export type HttpMethods = keyof {
        'GET': 'GET',
        'POST': 'POST',
        'PUT': 'PUT',
        'PATCH': 'PATCH',
        'DELETE': 'DELETE',
    };

    export interface ResponseField {
        name: string,
        description: string,
        type: string,
    }

    interface Parameter {
        name: string,
        description?: string | null,
        required?: boolean,
        example?: any,
        type?: string,
        __fields?: Record<string, scribe.Parameter>
    }

    export interface BodyParameter extends Parameter {
    }

    export interface QueryParameter extends Parameter {
    }

    export interface UrlParameter extends Parameter {
        // String or regular expression to match url parameter in URL and replace with value and placeholder
        match: string | RegExp
        // Normalised placeholder. If absent, we'll leave URL as is. Useful if parameter includes regex that you want to hide from end users.
        placeholder?: string
    }

    interface Metadata {
        groupName?: string
        groupDescription?: string
        title?: string
        description?: string
        authenticated?: boolean
    }

    export type Headers = Record<string, string>

    export type ParameterBag<T extends Parameter = Parameter> = Record<string, T>

    export type UrlParameters = ParameterBag<UrlParameter>

    export type QueryParameters = ParameterBag<QueryParameter>

    export type BodyParameters = ParameterBag<BodyParameter>

    export type ResponseFields = ParameterBag<ResponseField>

    export interface Response {
        status: number,
        description?: string,
        content: string
        headers?: Record<string, string[]>
    }

    /** The data returned from route matchers */
    export interface Route {
        uri: string,
        httpMethods: HttpMethods[],
        declaredAt: [string, number],
        handler: Function,
        originalRoute?: any,
        docblock?: Partial<DocBlock>,
    }

    export type SupportedRouters = 'express' | 'adonis' | 'restify';

    export type Stage = 'metadata' |
        'headers' |
        'urlParameters' |
        'queryParameters' |
        'bodyParameters' |
        'responses' |
        'responseFields';

    export interface ResponseCallRules {
        baseUrl: string,
        methods: Array<HttpMethods|'*'>,
        env: Record<string, any>,
        bodyParams: {},
        queryParams: {},
        fileParams: {},
        serverStartCommand?: string;
    }

    export interface RouteGroupApply {
        headers: Record<string, any>,
        responseCalls: ResponseCallRules
    }

    export interface RouteGroup {
        include: string[],
        exclude: string[],
        apply: RouteGroupApply,
    }

    export interface Config {
        baseUrl: string,
        title: string,
        description: string,
        logo: false | string,
        outputPath: string,
        theme?: string,
        tryItOut: {
            enabled: boolean,
            baseUrl: boolean,
        },
        auth: {
            enabled: boolean,
            default: boolean,
            in: 'query' | 'body' | 'bearer' | 'basic' | 'header',
            name: string,
            useValue: any,
            placeholder: string,
            extraInfo: string,
        },
        routes: RouteGroup[],
        postman: {
            enabled: boolean,
            overrides: Record<string, any>,
        },
        openapi: {
            enabled: boolean,
            overrides: Record<string, any>,
        },
        exampleLanguages: string[],
        defaultGroup: string,
        introText: string,
        strategies: {
            [stage in Stage]: string[]
        },
        fakerSeed: number | null;
    }

    export interface DocBlock {
        hideFromApiDocs?: boolean,
        title?: string | null,
        description?: string | null,
        authenticated?: boolean,
        unauthenticated?: boolean,
        group?: string | null,
        groupDescription?: string | null,
        header: Record<string, string>,
        urlParam: ParameterBag,
        queryParam: ParameterBag,
        bodyParam: ParameterBag,
        response: Array<{
            status?: string,
            scenario?: string,
            content?: string,
        }>,
        responseFile: Array<{
            status?: string,
            filePath?: string,
            extraJson?: string,
            scenario?: string,
        }>,
        responseField: ParameterBag,
    }

    export type ParameterTypes = {
        'number',
        'integer',
        'string',
        'boolean',
        'object',
        'file'
    }
}