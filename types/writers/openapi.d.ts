import { scribe } from "../../typedefs/core";
import { OpenAPIObject } from "openapi3-ts";
import OutputEndpointData = require("../camel/OutputEndpointData");
declare const _default: (config: scribe.Config) => {
    VERSION: string;
    makeOpenAPISpec: (groupedEndpoints: {
        name: string;
        description?: string;
        endpoints: OutputEndpointData[];
    }[]) => OpenAPIObject;
};
export = _default;
