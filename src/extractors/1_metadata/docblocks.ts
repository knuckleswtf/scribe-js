import {scribe} from "../../../typedefs/core";

async function run(endpoint: scribe.Endpoint, config: scribe.Config) {
    const docblock = endpoint.docblock;
    let isAuthenticated;
    if (docblock.authenticated) {
        isAuthenticated = true;
    } else if (docblock.unauthenticated) {
        isAuthenticated = false;
    } else {
        isAuthenticated = config.auth.default || false;
    }

    return {
        groupName: docblock.group || config.defaultGroup,
        groupDescription: docblock.groupDescription,
        title: docblock.title,
        description: docblock.description,
        authenticated: isAuthenticated,
    };
}

export = {
    routers: [],
    run
};