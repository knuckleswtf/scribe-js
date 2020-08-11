import {scribe} from "../../../typedefs/core";
const {getParameterExample, castValueToType} = require("../../utils/parameters");

async function run(endpoint: scribe.Endpoint, config) {
    return Object.fromEntries(Object.values(endpoint.docblock.bodyParam).map(p => {
        if (p.value === null) {
            // Set values for only required parameters
            p.value = p.required ? getParameterExample(p.type) : null;
        }

        p.value = castValueToType(p.value, p.type);

        return [p.name, p];
    }));
}

export = {
    routers: [],
    run
};