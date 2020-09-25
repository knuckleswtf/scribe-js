const {getParameterExample, removeEmptyOptionalParametersAndTransformToKeyExample} = require('../../dist/utils/parameters');

test('getParameterExample() generates correct examples by type', async () => {
    let example;

    example = getParameterExample("string");
    expect(typeof example === 'string').toBeTruthy();
    expect(example.length).toBeGreaterThan(0);

    example = getParameterExample("boolean");
    expect(typeof example === 'boolean').toBeTruthy();

    example = getParameterExample("integer");
    expect(typeof example === 'number').toBeTruthy();
    expect(parseInt(example.toString())).toEqual(example);

    example = getParameterExample("number");
    expect(typeof example === 'number').toBeTruthy();

    example = getParameterExample("object");
    expect(typeof example === 'object').toBeTruthy();
    expect(Object.keys(example).length).toEqual(0);

    example = getParameterExample("file");
    expect(typeof example === 'string').toBeTruthy();
    expect(example.length).toBeGreaterThan(0);
});

test('getParameterExample() generates correct examples for arrays', async () => {
    let example;

    example = getParameterExample("number[][]");
    expect(Array.isArray(example)).toBeTruthy();
    expect(example).toHaveLength(2);
    expect(example[0]).toHaveLength(2);
    expect(example[1]).toHaveLength(2);
    expect(typeof example[0][0] === 'number').toBeTruthy();
    expect(typeof example[0][1] === 'number').toBeTruthy();
    expect(typeof example[1][0] === 'number').toBeTruthy();
    expect(typeof example[1][1] === 'number').toBeTruthy();

    example = getParameterExample("string[][]");
    expect(Array.isArray(example)).toBeTruthy();
    expect(example).toHaveLength(2);
    expect(example[0]).toHaveLength(2);
    expect(example[1]).toHaveLength(2);
    expect(typeof example[0][0] === 'string').toBeTruthy();
    expect(typeof example[0][1] === 'string').toBeTruthy();
    expect(typeof example[1][0] === 'string').toBeTruthy();
    expect(typeof example[1][1] === 'string').toBeTruthy();
});

test('getParameterExample() generates correct examples by regex', async () => {
    let example;

    [/\d+/, /[a-z]{2}\d/].forEach(regex => {
        example = getParameterExample("string", regex);
        expect(example.match(regex)).toBeTruthy();
    });
});

test('removeEmptyOptionalParametersAndTransformToKeyExample() removes only empty optional parameters', async () => {
    let parameters = {
        param1: {
            name: 'param1',
            description: 'A param',
            required: true,
            value: 12.7,
            type: 'number',
        },
        param2: {
            name: 'param2',
            description: '',
            required: false,
            value: {d: 12.7},
            type: 'string',
        },
        param3: {
            name: 'param3',
            description: '',
            required: false,
            value: null,
            type: 'string',
        },
    };

    let results = removeEmptyOptionalParametersAndTransformToKeyExample(parameters);
    expect(results).toEqual({param1: 12.7, param2: {d: 12.7}});
});

test('removeEmptyOptionalParametersAndTransformToKeyExample() properly sets object keys', async () => {
    let parameters = {
        param1: {
            name: 'param1',
            description: 'An object param',
            required: false,
            value: [{}, {}],
            type: 'object[]',
        },
        'param1[].a': {
            name: 'param1[].a',
            description: '',
            required: false,
            value: 'haha',
            type: 'string',
        },
        'param1[].b': {
            name: 'param1[].b',
            description: '',
            required: true,
            value: 14,
            type: 'integer',
        },
    };

    let results = removeEmptyOptionalParametersAndTransformToKeyExample(parameters);
    const expected = {
        param1: [
            {
                a: 'haha',
                b: 14,
            },
            {
                a: 'haha',
                b: 14,
            }
        ],
    };
    try {
        expect(results).toEqual(expected);
    } catch (e) {
        // a is optional, so is present or absent at random
        delete expected.param1[1].a;
        expect(results).toEqual(expected);
    }
});