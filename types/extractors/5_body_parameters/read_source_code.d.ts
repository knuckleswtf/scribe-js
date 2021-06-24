import { scribe } from "../../../typedefs/core";
import Endpoint from "../../camel/Endpoint";
declare function run(endpoint: Endpoint): scribe.BodyParameters;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
