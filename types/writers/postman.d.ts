import { scribe } from "../../typedefs/core";
import { CollectionDefinition } from "postman-collection";
import OutputEndpointData from "../camel/OutputEndpointData";
declare const _default: (config: scribe.Config) => {
    VERSION: string;
    makePostmanCollection: (groupedEndpoints: {
        name: string;
        description?: string;
        endpoints: OutputEndpointData[];
    }[]) => CollectionDefinition & {
        info: {
            description: string;
            schema: string;
            _postman_id: string;
        };
    };
};
export = _default;
