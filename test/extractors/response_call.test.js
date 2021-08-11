// process.env.DEBUG = 'lib:scribe';;
// // jest.setTimeout(10000);
const Busboy = require('busboy');
const strategy = require('../../dist/extractors/6_responses/response_call');

const defaultHeaders = {
    "user-agent": "curl/7.22.0",
    host: "127.0.0.1:8100",
    connection: "close"
};
let testServer;
beforeAll((done) => {
    testServer = require('http')
        .createServer((req, res) => {
            let body = '';
            req.on('data', (data) => {
                body += data;
            });
            req.on('end', (data) => {
                const query = require('url').parse('http://localhost' + req.url, true).query;
                const headers = sortObjectKeys(req.headers); // Sort headers so we can assert consistently
                const response = {
                    method: req.method,
                    headers,
                    query,
                    body,
                };
                res.end(JSON.stringify(response));
            });
        })
        .on('error', (err) => {
            done(err);
        })
        .listen(8100, "127.0.0.1", () => {
            console.log("Listening on " + JSON.stringify(testServer.address()));
            done();
        });
});

afterAll( (done) => {
    testServer.close(done);
});

test('response_call strategy does not make call if rules forbid', async () => {
    let endpoint = {
        httpMethods: ['GET'],
        responses: [],
    };
    const routeGroup = {
        apply: {
            responseCalls: {
                methods: ['POST'],
            }
        }
    };
    const config = {routes: [routeGroup]};

    let responses = await strategy.run(endpoint, config, routeGroup.apply);
    expect(responses).toHaveLength(0);
});

test('response_call strategy does not make call if there is a 2xx response', async () => {
    let endpoint = {
        httpMethods: ['GET'],
        responses: [
            {
                status: 201,
                description: '',
                content: null
            }
        ],
    };
    const routeGroup = {
        apply: {
            responseCalls: {
                methods: ['GET'],
            }
        }
    };
    let responses = await strategy.run(endpoint, {routes: [routeGroup]}, routeGroup.apply);
    expect(responses).toHaveLength(0);
});

test('response_call strategy makes correct HTTP request to server', async () => {
    let endpoint = {
        uri: '/test1/:param',
        boundUri: '/test1/12',
        httpMethods: ['GET'],
        headers: {
            accept: 'application/json'
        },
        urlParameters: {},
        queryParameters: {},
        bodyParameters: {},
        cleanQueryParameters: {},
        cleanBodyParameters: {},
        fileParameters: {},
        responses: [],
    };
    const routeGroup = {
        apply: {
            responseCalls: {
                baseUrl: 'http://127.0.0.1:8100',
                methods: ['GET', 'POST'],
                env: {},
                bodyParams: {},
                queryParams: {},
                fileParams: {},
            }
        }
    };
    const config = {routes: [routeGroup]};

    let responses = await strategy.run(endpoint, config, routeGroup.apply);
    expect(responses).toHaveLength(1);
    expect(responses[0]).toMatchObject({
        status: 200,
        headers: {
            "content-length": "149"
        },
        content: JSON.stringify({
            method: endpoint.httpMethods[0],
            headers: sortObjectKeys(Object.assign({}, defaultHeaders, endpoint.headers)),
            query: endpoint.cleanQueryParameters,
            body: '',
        }, null, 4),
        description: '',
    });

    endpoint = {
        uri: '/test1/:param',
        boundUri: '/test1/12',
        httpMethods: ['POST'],
        headers: {},
        urlParameters: {},
        queryParameters: {},
        bodyParameters: {},
        cleanQueryParameters: {},
        cleanBodyParameters: {
            name: 'Ann',
        },
        fileParameters: {},
        responses: [],
    };

    responses = await strategy.run(endpoint, config, routeGroup.apply);
    expect(responses).toHaveLength(1);
    expect(responses[0]).toMatchObject({
        status: 200,
        headers: {
            "content-length": "162"
        },
        content: JSON.stringify({
            method: endpoint.httpMethods[0],
            headers: sortObjectKeys(Object.assign(
                {},
                defaultHeaders,
                endpoint.headers,
                {'content-length': "" + Buffer.byteLength(JSON.stringify(endpoint.cleanBodyParameters))})
            ),
            query: endpoint.cleanQueryParameters,
            body: JSON.stringify(endpoint.cleanBodyParameters),
        }, null, 4),
        description: '',
    });
});


test('response_call strategy handles file upload', (done) => {
    let endpoint = {
        uri: '/test1/upload',
        boundUri: '/test1/upload',
        httpMethods: ['PUT'],
        headers: {},
        urlParameters: {},
        queryParameters: {},
        bodyParameters: {},
        cleanQueryParameters: {},
        cleanBodyParameters: {
            another: "13",
        },
        fileParameters: {
            testThis: 'test/fixtures/test_response_call_upload.txt',
        },
        responses: [],
    };
    const routeGroup = {
        apply: {
            responseCalls: {
                baseUrl: 'http://127.0.0.1:8101',
                methods: ['*'],
            }
        }
    };
    const config = {routes: [routeGroup]};

    let contentLength;
    const uploadServer = require('http')
        .createServer((req, res) => {
            const busboy = new Busboy({headers: req.headers});
            const body = {};
            busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
                body[fieldname] = '';
                file.on('data', (data) => {
                    body[fieldname] += data;
                });
            });
            busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
                body[fieldname] = val;
            });
            busboy.on('finish', () => {
                const query = require('url').parse('http://localhost' + req.url, true).query;
                const headers = sortObjectKeys(req.headers); // Sort headers so we can assert consistently
                delete headers['content-type']; // The content boundary differs, so not testable
                const response = JSON.stringify({
                    method: req.method,
                    headers,
                    query,
                    body,
                });
                contentLength = response.length;
                res.end(response);
            });
            req.pipe(busboy);
        })
        .on('error', (err) => {
            done(err);
        })
        .listen(8101, "127.0.0.1", async () => {
            let responses = await strategy.run(endpoint, config, routeGroup.apply);

            const defaultHeaders = {
                "user-agent": "curl/7.22.0",
                host: "127.0.0.1:8101",
                connection: "close"
            };
            expect(responses).toHaveLength(1);
            expect(responses[0]).toMatchObject({
                status: 200,
                headers: {
                    "content-length": `${contentLength}`,
                },
                content: JSON.stringify({
                    method: endpoint.httpMethods[0],
                    headers: sortObjectKeys(Object.assign({}, defaultHeaders, endpoint.headers, {'transfer-encoding': 'chunked'})),
                    query: endpoint.cleanQueryParameters,
                    body: {testThis: "Just putting something here", another: "13"},
                }, null, 4),
                description: '',
            });

            uploadServer.close(done);
        });

});


function sortObjectKeys(obj) {
    const sorted = {};
    Object.keys(obj).sort().forEach(function (k) {
        sorted[k] = obj[k];
    });
    return sorted;
}