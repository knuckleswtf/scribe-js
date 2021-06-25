import {scribe} from "../../../typedefs/core";
import Endpoint from "../../camel/Endpoint";

const {getParameterExample, castValueToType} = require("../../utils/parameters");

async function run(endpoint: Endpoint, config: scribe.Config) {
    return Object.fromEntries(Object.values(endpoint.docblock.urlParam || {}).map(p => {
        if (p.example == null && !(p.description || '').includes(' No-example')) {
            p.example = getParameterExample(p.type || 'string');
        }
        p.example = castValueToType(p.example, p.type);
        p.description = (p.description || '').replace(/\s+No-example.?/, '');

        return [p.name, p];
    }));
}

export = {
    routers: [],
    run
};