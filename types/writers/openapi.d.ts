import { scribe } from "../../typedefs/core";
import { OpenAPIObject } from "openapi3-ts";
declare const _default: (config: scribe.Config) => {
    VERSION: string;
    makeOpenAPISpec: (groupedEndpoints: {
        [groupName: string]: scribe.Route[];
    }) => OpenAPIObject;
};
export = _default;
