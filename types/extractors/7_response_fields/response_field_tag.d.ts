import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Endpoint, config: scribe.Config): Promise<Record<string, scribe.BodyParameter>>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
