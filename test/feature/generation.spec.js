process.env.SCRIBE_GENERATE = "1";

const fs = require('fs');
const path = require("path");
const restifyServerPath = path.resolve(__dirname, '../fixtures/restify.routes.js');
const cheerio = require('cheerio');
const { copyDirectory } = require('../../dist/utils/writing');
const { mockConfig } = require('../utils');

const {generate} = require('../../dist');
const restifyGenerate = require('../../frameworks/restify/src/cli/generate');

describe('Generation', () => {
    afterEach(function () {
        fs.rmdirSync(process.cwd() + '/.scribe', {recursive: true});
        fs.rmdirSync(process.cwd() + '/public/docs', {recursive: true});
    });

// it('can_skip_methods_and_classes_with_hidefromapidocumentation_tag', async () => {
// it('warns_of_nonexistent_response_files', async () => {
// it('can_parse_utf8_response', async () => {
// it('respects_endpoints_and_group_sort_order', async () => {
// response calls

    it('can_append_custom_http_headers', async () => {
        const config = mockConfig({
            'routes.0.apply.headers': {
                Authorization: 'customAuthToken',
                'Custom-Header': 'NotSoCustom'
            },
            'routes.0.apply.responseCalls.methods': [],
        });
        await restifyGenerate({config, server: restifyServerPath});

        const endpointDetails = scribeFile( 'endpoints/00.yaml').endpoints[0];
        expect(endpointDetails.headers["Authorization"]).toEqual("customAuthToken");
        expect(endpointDetails.headers["Custom-Header"]).toEqual("NotSoCustom");
    });
/*
    it('will_auto_set_content_type_to_multipart_if_file_params_are_present', async () => {        /!**
     * @bodyParam param string required
     *!/
    RouteFacade::post('no-file', fn() => null);
        /!**
         * @bodyParam a_file file required
         *!/
        RouteFacade::post('top-level-file', fn() => null);
        /!**
         * @bodyParam data object
         * @bodyParam data.thing string
         * @bodyParam data.a_file file
         *!/
        RouteFacade::post('nested-file', fn() => null);

        const config = mockConfig({
            'routes.0.apply.responseCalls.methods': [],
        });
        const endpoints = [
            {
                uri: '/get-string',
                httpMethods: ['GET'],
                handler: () => null,
                declaredAt: [__filename, 8],
            },
        ];
        await generate(endpoints, config, 'restify', null);

        const group = scribeFile( 'endpoints/00.yaml').endpoints[0];
        expect(group.endpoints[0].uri).toEqual('no-file');
        expect(group.endpoints[0].headers['content-type']).toEqual('application/json');
        expect(group.endpoints[1].uri).toEqual('top-level-file');
        expect(group.endpoints[1].headers['content-type']).toEqual('multipart/form-data');
        expect(group.endpoints[2].uri).toEqual('nested-file');
        expect(group.endpoints[2].headers['content-type']).toEqual('multipart/form-data');
    });*/

    it('merges_user_defined_endpoints', async () => {
        if (!fs.existsSync('.scribe/endpoints'))
            fs.mkdirSync('.scribe/endpoints', {recursive: true});
        fs.copyFileSync(__dirname + '/../fixtures/custom.0.yaml', '.scribe/endpoints/custom.0.yaml');

        const config = mockConfig({
            'routes.0.include': ['api/*'],
            'routes.0.apply.responseCalls.methods': [],
        });
        await restifyGenerate({config, server: restifyServerPath});

        const $ = cheerio.load(fs.readFileSync('public/docs/index.html'));
        const headings = $('h1').get();
        // There should only be four headings — intro, auth and two groups
        expect(headings).toHaveSize(4);
        let [_, __, group1, group2] = headings;
        expect(group1.firstChild.data).toEqual('1. Group 1');
        expect(group2.firstChild.data).toEqual('2. Group 2');
        const expectedEndpoints = $('h2').get();
        expect(expectedEndpoints).toHaveSize(3);
        // Enforce the order of the endpoints
        // Ideally, we should also check the groups they're under
        expect(expectedEndpoints[0].firstChild.data).toEqual("Some endpoint.");
        expect(expectedEndpoints[1].firstChild.data).toEqual("User defined");
        expect(expectedEndpoints[2].firstChild.data).toEqual("GET api/action2");
    });

    it('will_not_extract_if_noExtraction_flag_is_set', async () => {
        await copyDirectory(__dirname + '/../fixtures/.scribe', process.cwd() + '/.scribe');

        let output = "";
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = (text) => {output += text};
        await restifyGenerate({config: mockConfig(), extraction: false});

        process.stdout.write = originalWrite;
        expect(output).not.toContain("Processing route");

        const $ = cheerio.load(fs.readFileSync('public/docs/index.html'));
        const [intro, auth] = $('h1 + p').get();
        expect(intro.firstChild.data).toEqual('Heyaa introduction!👋');
        expect(auth.firstChild.data).toEqual('This is just a test.');
        const group = $('h1').get(2);
        expect(group.firstChild.data).toEqual('General');
        const expectedEndpoint = $('h2').get();
        expect(expectedEndpoint).toHaveSize(1);
        expect(expectedEndpoint[0].firstChild.data).toEqual("Healthcheck");
    });

});

function scribeFile(file) {
    const yaml = require('js-yaml');
    return yaml.load(fs.readFileSync(process.cwd() + '/.scribe/' + file));
}