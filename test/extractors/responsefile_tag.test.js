const strategy = require('../../dist/extractors/6_responses/responsefile_tag');
const {parseDocBlockString} = require('../../dist/utils/docblocks');
const fs = require("fs");

test('responsefile_tag strategy correctly extracts response from file', async () => {

    const docBlockString = `
/**
 * @responseFile test/fixtures/responsefile.json scenario="Success"
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
        content: JSON.stringify(JSON.parse(content), null, 4),
        description: '200, Success',
    });
});

test('responsefile_tag strategy works with multiple files and statuses and can overwrite content', async () => {

    const docBlockString = `
/**
 * @responseFile 201 test/fixtures/responsefile.json
 * @responseFile status=401 scenario=Oops test/fixtures/responsefile.json
 * @responseFile 400 scenario="Bad request" test/fixtures/responsefile.json {"error": "not found"}
 */`;
    const docblock = await parseDocBlockString(docBlockString);
    let endpoint = {
        docblock
    };

    let responses = await strategy.run(endpoint);
    expect(responses).toHaveLength(3);
    const content = fs.readFileSync(__dirname + '/../fixtures/responsefile.json', 'utf8');
    const fileResponse = JSON.stringify(JSON.parse(content), null, 4);
    expect(responses[0]).toEqual({
        status: 201,
        content: fileResponse,
        description: '201',
    });
    expect(responses[1]).toEqual({
        status: 401,
        content: fileResponse,
        description: '401, Oops',
    });
    const parsedContent = JSON.parse(content);
    parsedContent.error = "not found";
    const mergedContent = JSON.stringify(parsedContent, null, 4);
    expect(responses[2]).toEqual({
        status: 400,
        content: mergedContent,
        description: '400, Bad request',
    });
});