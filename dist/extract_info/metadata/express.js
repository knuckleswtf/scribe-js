"use strict";
function getEndpointMetadata(endpoint, config) {
    return {
        groupName: config.defaultGroup,
        groupDescription: '',
        title: null,
        description: '',
        authenticated: false,
    };
}
module.exports = (endpoint, config) => {
    return getEndpointMetadata(endpoint, config);
};
//# sourceMappingURL=express.js.map