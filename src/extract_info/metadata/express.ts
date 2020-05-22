import {express} from "../../../typedefs/express";
import {endpoint} from "../../../typedefs/core";

function getEndpointMetadata(endpoint: endpoint.Endpoint, config) {
    return {
        groupName: config.defaultGroup,
        groupDescription: '',
        title: null,
        description: '',
        authenticated: false,
    };
}

export = (endpoint: endpoint.Endpoint, config) => {
    return getEndpointMetadata(endpoint, config);
};