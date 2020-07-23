import {scribe} from "../../../typedefs/core";
import d = require("../../utils/docblocks");

async function run(endpoint: scribe.Endpoint, config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint);

    return {
        groupName: docblock.group || config.defaultGroup,
        groupDescription: docblock.groupDescription,
        title: docblock.title,
        description: docblock.description,
        authenticated: docblock.authenticated,
    };
}

export = {
    routers: [],
    run
};