export declare namespace scribe {

    export interface ResponseField {
        name: string,
        description: string,
        type: string,
    }

    interface Parameter {
        name: string,
        description?: string | null,
        required?: boolean,
        value?: any,
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
    }

    export interface Route {
        uri: string,
        boundUri?: string,
        methods: string[],
        declaredAt: [string, number],
        metadata?: Metadata
        headers?: Headers
        urlParameters?: UrlParameters
        queryParameters?: QueryParameters
        bodyParameters?: BodyParameters
        nestedBodyParameters?: ParameterBag<BodyParameter>
        cleanQueryParameters?: Record<string, any>
        cleanBodyParameters?: Record<string, any>
        fileParameters?: Record<string, any>
        responses?: Response[]
        responseFields?: ResponseFields
        handler: Function,
        docblock?: Partial<DocBlock>,
        auth?: string,
        originalRoute?: any,
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
        methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | '*'>,
        env: Record<string, any>,
        bodyParams: {},
        queryParams: {},
        fileParams: {},
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
        interactive: boolean,
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
        response: Response[],
        responseFile: Array<{
            status?: string,
            filePath?: string,
            extraJson?: string,
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