import { scribe } from "../../typedefs/core";
import { OpenAPIObject } from "openapi3-ts";
import Endpoint from "../camel/Endpoint";
declare const _default: (config: scribe.Config) => {
    VERSION: string;
    makeOpenAPISpec: (groupedEndpoints: {
        name: string;
        description?: string;
        endpoints: Endpoint[];
    }[]) => OpenAPIObject;
};
export = _default;
