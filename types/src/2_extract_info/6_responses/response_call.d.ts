import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Endpoint, config: any): Promise<scribe.Response[]>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
