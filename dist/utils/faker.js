"use strict";
let fakerInstance;
module.exports = (seed = null) => {
    if (fakerInstance) {
        return fakerInstance;
    }
    const faker = require('faker');
    if (seed) {
        faker.seed(seed);
    }
    fakerInstance = faker;
    return fakerInstance;
};
//# sourceMappingURL=faker.js.map