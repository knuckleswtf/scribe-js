const strategy = require('../../dist/extractors/6_responses/responsefile_tag');
const {parseDocBlockString} = require('../../dist/utils/docblocks');
const fs = require("fs");

test('responsefile_tag strategy correctly extracts response from file', async () => {

    const docBlockString = `
/**
 * @responseFile test/fixtures/responsefile.json
 */`;
    const docblock = await parseDocBlockString(docBlockString);
    let endpoint = {
        docblock
    };

    let responses = await strategy.run(endpoint);
    expect(responses).toHaveLength(1);
    const content = fs.readFileSync(__dirname + '/../fixtures/responsefile.json', 'utf8');
    expect(responses[0]).toEqual({
        status: 200,
        content,
        description: '',
    });
});

test('responsefile_tag strategy works with multiple files and statuses and can overwrite content', async () => {

    const docBlockString = `
/**
 * @responseFile 201 test/fixtures/responsefile.json
 * @responseFile 400 test/fixtures/responsefile.json {"error": "not found"}
 */`;
    const docblock = await parseDocBlockString(docBlockString);
    let endpoint = {
        docblock
    };

    let responses = await strategy.run(endpoint);
    expect(responses).toHaveLength(2);
    const content = fs.readFileSync(__dirname + '/../fixtures/responsefile.json', 'utf8');
    expect(responses[0]).toEqual({
        status: 201,
        content,
        description: '',
    });
    const parsedContent = JSON.parse(content);
    parsedContent.error = "not found";
    const mergedContent = JSON.stringify(parsedContent);
    expect(responses[1]).toEqual({
        status: 400,
        content: mergedContent,
        description: '',
    });
});