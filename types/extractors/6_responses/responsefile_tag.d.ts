import { scribe } from "../../../typedefs/core";
import Endpoint from "../../endpoint";
declare function run(endpoint: Endpoint, config: scribe.Config): Promise<any[]>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
