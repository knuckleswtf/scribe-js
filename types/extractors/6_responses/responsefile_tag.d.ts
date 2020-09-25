import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Endpoint, config: scribe.Config): Promise<any[]>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
