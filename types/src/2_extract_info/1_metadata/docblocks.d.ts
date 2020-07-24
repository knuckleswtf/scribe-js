import { scribe } from "../../../typedefs/core";
declare function run(endpoint: scribe.Endpoint, config: any): {
    groupName: any;
    groupDescription: string;
    title: any;
    description: string;
    authenticated: boolean;
};
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
