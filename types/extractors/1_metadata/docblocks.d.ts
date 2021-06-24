import { scribe } from "../../../typedefs/core";
import Endpoint from "../../camel/Endpoint";
declare function run(endpoint: Endpoint, config: scribe.Config): Promise<{
    groupName: string;
    groupDescription: string;
    title: string;
    description: string;
    authenticated: any;
}>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
