import { scribe } from "../../typedefs/core";
import { CollectionDefinition } from "postman-collection";
import Endpoint from "../camel/Endpoint";
declare const _default: (config: scribe.Config) => {
    VERSION: string;
    makePostmanCollection: (groupedEndpoints: {
        name: string;
        description?: string;
        endpoints: Endpoint[];
    }[]) => CollectionDefinition & {
        info: {
            description: string;
            schema: string;
            _postman_id: string;
        };
    };
};
export = _default;
