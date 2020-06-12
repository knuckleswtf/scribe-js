import {express} from "./express";
import exp from "constants";

export declare namespace scribe {

    export interface ResponseField {
        description: string,
        type: 'string',
    }

    interface Parameter {
        name: string,
        description: string,
        required: boolean
        value: any
    }

    export interface BodyParameter extends Parameter {
        type: 'string'|'integer'|'number',
    }

    export type QueryParameter = Parameter

    export interface UrlParameter extends Parameter {
        // String or regular expression to match url parameter in URL and replace with value and placeholder
        match: string|RegExp
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

    export type UrlParameters = Record<string, UrlParameter>

    export type QueryParameters = Record<string, QueryParameter>

    export type BodyParameters = Record<string, BodyParameter>

    export type ResponseFields = Record<string, ResponseField>

    export interface Response {
        status: number,
        description?: string,
        content: string
    }

    export interface Endpoint {
        uri: string,
        boundUri?: string,
        methods: string[],
        metadata?: Metadata
        headers?: Headers
        urlParameters?: UrlParameters
        queryParameters?: QueryParameters
        bodyParameters?: BodyParameters
        responses?: Response[]
        responseFields?: ResponseFields
        route: express.Route,
        handler: Function,
    }

    export type SupportedRouters = 'express';

    export type Stage = 'metadata' |
        'headers' |
        'urlParameters' |
        'queryParameters' |
        'bodyParameters' |
        'responses' |
        'responseFields';

    export interface Config {
        baseUrl: string,
        title: string,
        logo: false | string,
        router: SupportedRouters,
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
            }
        ],
        exampleLanguages: string[],
        defaultGroup: string,
        introText: string,
        strategies: {
            [stage in Stage]: Strategy[]
        }
    }

    export interface Strategy {
        routers: SupportedRouters[] | null,
        run: (endpoint: Endpoint, config: Config) => any
    }

    export interface MetadataStrategy extends Strategy {
        run: (endpoint: Endpoint, config: Config) => Metadata
    }

    export interface HeadersStrategy extends Strategy {
        run: (endpoint: Endpoint, config: Config) => Headers
    }

    export interface UrlParametersStrategy extends Strategy {
        run: (endpoint: Endpoint, config: Config) => UrlParameter[]
    }

    export interface QueryParametersStrategy extends Strategy {
        run: (endpoint: Endpoint, config: Config) => QueryParameter[]
    }

    export interface BodyParametersStrategy extends Strategy {
        run: (endpoint: Endpoint, config: Config) => BodyParameter[]
    }

    export interface ResponsesStrategy extends Strategy {
        run: (endpoint: Endpoint, config: Config) => Response[]
    }

    export interface ResponseFieldsStrategy extends Strategy {
        run: (endpoint: Endpoint, config: Config) => ResponseField[]
    }
}