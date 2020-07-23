import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Endpoint, config: any): {
    groupName: any;
    groupDescription: any;
    title: any;
    description: any;
    authenticated: any;
};
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
