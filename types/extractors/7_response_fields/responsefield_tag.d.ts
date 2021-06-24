import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Route, config: scribe.Config): Promise<scribe.ParameterBag<scribe.Parameter>>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
