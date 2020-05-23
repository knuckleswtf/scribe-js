import {express} from "./express";

export declare namespace endpoint {

    interface ResponseField {
        description: string,
        type: 'string',
    }

    interface Parameter {
        name: string,
        description: string,
        required: boolean
        value: any
    }

    interface BodyParameter extends Parameter {
        type: 'string',
    }

    type QueryParameter = Parameter

    type UrlParameter = Parameter

    interface Metadata {
        groupName?: string
        groupDescription?: string
        title?: string
        description?: string
        authenticated?: boolean
    }

    export  interface Response {
        status: number,
        description?: string,
        content: string
    }

    export interface Endpoint {
        uri: string,
        boundUri?: string,
        methods: string[],
        metadata?: Metadata
        headers?: {
            [name: string]: string
        }
        bodyParameters?: BodyParameter[]
        queryParameters?: QueryParameter[]
        urlParameters?: UrlParameter[]
        responses?: Response[]
        responseFields?: ResponseField[]
        route: express.Route,
        handler: Function,
    }
}