import {scribe} from "../../../typedefs/core";

function run(endpoint: scribe.Endpoint, config) {
    return {
        groupName: config.defaultGroup,
        groupDescription: '',
        title: null,
        description: '',
        authenticated: false,
    };
}

export = {
    routers: [],
    run
};