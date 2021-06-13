import { scribe } from "../../typedefs/core";
import { CollectionDefinition } from "postman-collection";
declare const _default: (config: scribe.Config) => {
    VERSION: string;
    makePostmanCollection: (groupedEndpoints: {
        [groupName: string]: scribe.Route[];
    }) => CollectionDefinition & {
        info: {
            description: string;
            schema: string;
            _postman_id: string;
        };
    };
};
export = _default;
