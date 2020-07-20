const { parseDocBlocksFromFile, parseDocBlockString } = require('../../dist/utils/docblocks');
const path = require('path');

test('can retrieve all docblocks from a file', async () => {
    const docBlocks = await parseDocBlocksFromFile(path.resolve(__dirname + '/../fixtures/file_with_docblocks.js'));
    expect(docBlocks).toHaveLength(4);
    console.log(docBlocks);

    expect(docBlocks[0].startsAt).toEqual(1);
    expect(docBlocks[0].endsAt).toEqual(6);

    expect(docBlocks[1].startsAt).toEqual(11);
    expect(docBlocks[1].endsAt).toEqual(16);

    expect(docBlocks[2].startsAt).toEqual(18);
    expect(docBlocks[2].endsAt).toEqual(21);

    expect(docBlocks[3].startsAt).toEqual(26);
    expect(docBlocks[3].endsAt).toEqual(40);
});

test('can parse docblock tags', async () => {
    let docBlock = `
/**
 * Title
 *
 * Description. Still part
 * of the description.
 *
 * @group The group
 * @authenticated
 * @header X-Hello World
 * @urlParam {string} ID The id. This description
 *   spans multiple lines.
 * @queryParam {string} page The page
 * @bodyParam {string} type The type
 * @bodyParam {string} otherType The other type
 */`;
    const parsedDocBlock = await parseDocBlockString(docBlock);
    console.log(parsedDocBlock);
});