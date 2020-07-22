const { parseDocBlocksFromFile, parseDocBlockString } = require('../../dist/utils/docblocks');
const path = require('path');

test('can retrieve all docblocks from a file', async () => {
    const docBlocks = await parseDocBlocksFromFile(path.resolve(__dirname + '/../fixtures/file_with_docblocks.js'));
    expect(docBlocks).toHaveLength(4);

    expect(docBlocks[0].startsAt).toEqual(1);
    expect(docBlocks[0].endsAt).toEqual(6);

    expect(docBlocks[1].startsAt).toEqual(11);
    expect(docBlocks[1].endsAt).toEqual(16);

    expect(docBlocks[2].startsAt).toEqual(18);
    expect(docBlocks[2].endsAt).toEqual(21);

    expect(docBlocks[3].startsAt).toEqual(26);
    expect(docBlocks[3].endsAt).toEqual(40);
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