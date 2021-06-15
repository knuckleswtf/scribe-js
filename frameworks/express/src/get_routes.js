
function getRoutesFromOurDecorator(decorator) {
    // At this point, there should be only one root app or router
    let [[, routes]] = decorator.subApps.size ? decorator.subApps : decorator.subRouters;

    return routes;
}

module.exports = (decorator) => {
    return getRoutesFromOurDecorator(decorator);
};