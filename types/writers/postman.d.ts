import { scribe } from "../../typedefs/core";
import { CollectionDefinition } from "postman-collection";
declare const _default: (config: scribe.Config) => {
    makePostmanCollection: (groupedEndpoints: {
        [groupName: string]: scribe.Endpoint[];
    }) => CollectionDefinition & {
        info: {
            description: string;
            schema: string;
            _postman_id: string;
        };
    };
};
export = _default;
