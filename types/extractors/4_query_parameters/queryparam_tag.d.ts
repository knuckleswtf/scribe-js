import { scribe } from "../../../typedefs/core";
import Endpoint from "../../camel/Endpoint";
declare function run(endpoint: Endpoint, config: scribe.Config): Promise<{
    [k: string]: scribe.Parameter;
}>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
