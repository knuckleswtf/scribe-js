import { scribe } from "../../../typedefs/core";
import Endpoint = scribe.Endpoint;
declare function run(endpoint: Endpoint): scribe.BodyParameter[];
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
