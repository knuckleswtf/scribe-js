const {parseDocBlocksFromFile, parseDocBlockString, getDocBlockForEndpoint} = require('../../dist/utils/docblocks');
const path = require('path');

test('can retrieve all docblocks from a file', async () => {
    const docBlocks = await parseDocBlocksFromFile(path.resolve(__dirname + '/../fixtures/file_with_docblocks.js'));
    expect(docBlocks).toHaveLength(4);

    expect(docBlocks[0].startsAt).toEqual(1);
    expect(docBlocks[0].endsAt).toEqual(6);

    expect(docBlocks[1].startsAt).toEqual(12);
    expect(docBlocks[1].endsAt).toEqual(17);

    expect(docBlocks[2].startsAt).toEqual(19);
    expect(docBlocks[2].endsAt).toEqual(22);

    expect(docBlocks[3].startsAt).toEqual(27);
    expect(docBlocks[3].endsAt).toEqual(41);
});

test('parses docblock tags as expected', async () => {
    let docBlock = `
/**
 * The title
 *
 * Description. Still part
 * of the description.
 *
 * @group The group name
 * @authenticated
 * @header X-Hello World
 * @urlParam {number} id The id.
 * @queryParam {string} page The page
 * @bodyParam {string} nothing
 * @bodyParam {string} requiredOnly required
 * @bodyParam {string} descriptionOnly This is a description.
 * @bodyParam {string} exampleOnly Example: 12
 * @bodyParam {string} requiredAndDescription required This is a description.
 * @bodyParam {string} requiredAndExample required Example: 12
 * @bodyParam {string} descriptionAndExample  This is a description. Example: 12  
 * @bodyParam {string} requiredAndDescriptionAndExample required This is a description. Example: 12
 */`;
    const parsedDocBlock = await parseDocBlockString(docBlock);
    expect(parsedDocBlock.title).toEqual("The title");
    expect(parsedDocBlock.description).toEqual("Description. Still part\nof the description.");
    expect(parsedDocBlock.group).toEqual("The group name");
    expect(parsedDocBlock.authenticated).toEqual(true);
    expect(parsedDocBlock.unauthenticated).toEqual(false);
    expect(parsedDocBlock.header).toEqual({'X-Hello': 'World'});
    expect(parsedDocBlock.urlParam).toEqual({
        id: {
            name: 'id',
            type: 'number',
            required: false,
            description: "The id.",
            value: null
        }
    });
    expect(parsedDocBlock.queryParam).toEqual({
        page: {
            name: 'page',
            type: 'string',
            required: false,
            description: "The page",
            value: null
        }
    });
    expect(parsedDocBlock.bodyParam).toEqual({
        nothing: {
            name: 'nothing',
            type: 'string',
            required: false,
            description: null,
            value: null
        },
        requiredOnly: {
            name: 'requiredOnly',
            type: 'string',
            required: true,
            description: null,
            value: null
        },
        descriptionOnly: {
            name: 'descriptionOnly',
            type: 'string',
            required: false,
            description: 'This is a description.',
            value: null
        },
        exampleOnly: {
            name: 'exampleOnly',
            type: 'string',
            required: false,
            description: null,
            value: '12',
        },
        requiredAndDescription: {
            name: 'requiredAndDescription',
            type: 'string',
            required: true,
            description: 'This is a description.',
            value: null,
        },
        requiredAndExample: {
            name: 'requiredAndExample',
            type: 'string',
            required: true,
            description: null,
            value: '12',
        },
        descriptionAndExample: {
            name: 'descriptionAndExample',
            type: 'string',
            required: false,
            description: 'This is a description.',
            value: '12',
        },
        requiredAndDescriptionAndExample: {
            name: 'requiredAndDescriptionAndExample',
            type: 'string',
            required: true,
            description: 'This is a description.',
            value: '12',
        },
    });

});

test('can retrieve the docblock for an endpoint based on its declaration file and line', async () => {
    const file1 = path.resolve(__dirname + '/../fixtures/file_with_docblocks.js');

    let docBlock = await getDocBlockForEndpoint({declaredAt: [file1, 11]});
    expect(docBlock).toEqual(null);

    docBlock = await getDocBlockForEndpoint({declaredAt: [file1, 42]});
    expect(docBlock).toEqual({
            title: 'Title',
            description: "Description. Still part\nof the description.",
            authenticated: true,
            unauthenticated: false,
            hideFromApiDocs: false,
            group: 'The group',
            groupDescription: null,
            header: {'X-Hello': 'World'},
            urlParam: {
                ID: {
                    name: 'ID',
                    type: 'string',
                    required: false,
                    description: "The id. This description\n spans multiple lines.",
                    value: null
                }
            },
            queryParam: {
                page: {
                    name: 'page',
                    type: 'string',
                    required: false,
                    description: 'The page',
                    value: null
                }
            },
            bodyParam: {
                type: {
                    name: 'type',
                    type: 'string',
                    required: false,
                    description: 'The type',
                    value: null
                },
                otherType: {
                    name: 'otherType',
                    type: 'string',
                    required: false,
                    description: 'The other type',
                    value: null
                }
            },
            response: [],
            responseFile: [],
            responseField: {},
        }
    );

    docBlock = await getDocBlockForEndpoint({declaredAt: [file1, 45]});
    expect(docBlock).toEqual(null);
});