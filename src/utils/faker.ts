let fakerInstance;

export = (seed: number = null) => {
    if (fakerInstance) {
        return fakerInstance;
    }

    const faker = require('faker');
    if (seed) {
        faker.seed(seed);
    }

    fakerInstance = faker;
    return fakerInstance;
}