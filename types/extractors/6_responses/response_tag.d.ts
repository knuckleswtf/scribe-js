import Endpoint from "../../camel/Endpoint";
declare function run(endpoint: Endpoint, config: any): Promise<any[]>;
declare const _default: {
    routers: any[];
    run: typeof run;
};
export = _default;
