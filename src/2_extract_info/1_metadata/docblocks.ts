import {scribe} from "../../../typedefs/core";
import d = require("../../utils/docblocks");

async function run(endpoint: scribe.Endpoint, config: scribe.Config) {
    const docblock = await d.getDocBlockForEndpoint(endpoint) || {} as scribe.DocBlock;

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