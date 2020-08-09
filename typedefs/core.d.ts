import {express} from "./express";
import exp from "constants";
import {RequestAuthDefinition} from "postman-collection";

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

    export interface Endpoint {
        uri: string,
        boundUri?: string,
        methods: string[],
        declaredAt: [string, number],
        metadata?: Metadata
        headers?: Headers
        urlParameters?: UrlParameters
        queryParameters?: QueryParameters
        bodyParameters?: BodyParameters
        cleanQueryParameters?: Record<string, any>
        cleanBodyParameters?: Record<string, any>
        fileParameters?: Record<string, any>
        responses?: Response[]
        responseFields?: ResponseFields
        route: express.Route,
        handler: Function,
        docblock?: DocBlock,
        auth?: string,
    }

    export type SupportedRouters = 'express';

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
        bodyParams: {

        },
        queryParams: {

        },
    }

    export interface Config {
        baseUrl: string,
        title: string,
        logo: false | string,
        outputPath: string,
        router?: SupportedRouters,
        auth: {
            enabled: boolean,
            in: 'query' | 'body' | 'bearer' | 'basic' | 'header',
            name: string,
            useValue: any,
            extraInfo: string,
        },
        routes: [
            {
                include: string[],
                exclude: string[],
                apply: {
                    headers: Record<string, any>,
                    responseCalls: ResponseCallRules
                }
            }
        ],
        postman: {
            enabled: boolean,
            description: string,
            auth?: RequestAuthDefinition,
        },
        exampleLanguages: string[],
        defaultGroup: string,
        introText: string,
        strategies: {
            [stage in Stage]: Strategy[]
        }
    }

    export interface Strategy<T = any> {
        routers: SupportedRouters[] | null,
        run: (endpoint: Endpoint, config: Config, routeGroup: typeof config.routes[0]) => T
    }

    export interface MetadataStrategy extends Strategy<Metadata> {
    }

    export interface HeadersStrategy extends Strategy<Headers> {
    }

    export interface UrlParametersStrategy extends Strategy<UrlParameters> {
    }

    export interface QueryParametersStrategy extends Strategy<QueryParameters> {
    }

    export interface BodyParametersStrategy extends Strategy<BodyParameters> {
    }

    export interface ResponsesStrategy extends Strategy<Response[]> {
    }

    export interface ResponseFieldsStrategy extends Strategy<ResponseFields> {
    }

    export interface DocBlock {
        hideFromApiDocs?: boolean,
        title?: string | null,
        description?: string | null,
        authenticated?: boolean,
        group?: string | null,
        groupDescription?: string | null,
        header: Record<string, string>,
        urlParam: ParameterBag<BodyParameter>,
        queryParam: ParameterBag<BodyParameter>,
        bodyParam: ParameterBag<BodyParameter>,
        response: Response[],
        responseFile: Array<{
            status?: string,
            filePath?: string,
            extraJson?: string,
        }>,
        responseField: ParameterBag<BodyParameter>,
    }
}