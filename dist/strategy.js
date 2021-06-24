'use strict';
class Strategy {
    constructor(config) {
        this.config = config;
        this.routers = null;
    }
    shouldRun(endpoint, routeGroupRules, currentRouter) {
        if (this.routers == null || this.routers.length == 0) {
            return true;
        }
        return this.routers.includes(currentRouter);
    }
    invoke(endpoint, routeGroupRules, currentRouter) {
        if (this.shouldRun(endpoint, routeGroupRules, currentRouter)) {
            return this.run(endpoint, routeGroupRules, currentRouter);
        }
        return null;
    }
    run(endpoint, routeGroupRules, currentRouter) {
        return null;
    }
}
module.exports = Strategy;
//# sourceMappingURL=strategy.js.map