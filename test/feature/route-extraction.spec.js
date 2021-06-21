const path = require("path");

process.env.SCRIBE_GENERATE = "1";

const sinon = require('sinon');
const scribe = require('../../dist/index');
const handlers = require('../fixtures/handlers');

const sandbox = sinon.createSandbox();
let stub;

beforeEach(function () {
    stub = sandbox.stub(scribe, 'generate');
});

afterEach(function () {
    sandbox.restore();
});

it('can extract Express routes', async () => {
    const generate = require('../../frameworks/express/src/cli/generate');
    let expressAppPath = path.resolve(__dirname, '../fixtures/express.routes.js');
    generate({config: path.resolve(__dirname, '../../config.js'), app: expressAppPath});

    expect(stub.calledOnce).toEqual(true);
    const expectedRoutes = [
        {
            uri: '/main-app',
            methods: ['GET'],
            handler: handlers[0],
            declaredAt: [expressAppPath, 8],
        },
        {
            uri: '/main-app',
            methods: ['POST'],
            handler: handlers[1],
            declaredAt: [expressAppPath, 9],
        },
        {
            uri: '/main-app-multi',
            methods: ['GET'],
            handler: handlers[0],
            declaredAt: [expressAppPath, 11],
        },
        {
            uri: '/main-app-multi',
            methods: ['POST'],
            handler: handlers[1],
            declaredAt: [expressAppPath, 12],
        },
        {
            uri: '/sub-app',
            methods: ['GET'],
            handler: handlers[0],
            declaredAt: [expressAppPath, 15],
        },
        {
            uri: '/sub-app/post',
            methods: ['POST'],
            handler: handlers[1],
            declaredAt: [expressAppPath, 16],
        },
        {
            uri: '/sub-app/sub-app',
            methods: ['GET'],
            handler: handlers[2],
            declaredAt: [expressAppPath, 19],
        },
        {
            uri: '/sub-router',
            methods: ['GET'],
            handler: handlers[0],
            declaredAt: [expressAppPath, 25],
        },
        {
            uri: '/sub-router/post',
            methods: ['POST'],
            handler: handlers[1],
            declaredAt: [expressAppPath, 26],
        },
        {
            uri: '/sub-router/sub-router',
            methods: ['GET'],
            handler: handlers[2],
            declaredAt: [expressAppPath, 29],
        },
    ];
    const actualRoutes = stub.getCall(0).args[0];
    expect(actualRoutes).toHaveSize(expectedRoutes.length);
    expectedRoutes.forEach(
        r => expect(actualRoutes).toContain(jasmine.objectContaining(r))
    );
});

it('can extract Restify routes', async () => {
    const generate = require('../../frameworks/restify/src/cli/generate');
    let restifyServerPath = path.resolve(__dirname, '../fixtures/restify.routes.js');
    generate({config: path.resolve(__dirname, '../../config.js'), server: restifyServerPath});

    expect(stub.calledOnceWith([
        {
            uri: '/get-string',
            methods: ['GET'],
            handler: handlers[0],
            declaredAt: [restifyServerPath, 8],
        },
        {
            uri: '/post-object',
            methods: ['POST'],
            handler: handlers[1],
            declaredAt: [restifyServerPath, 10],
        }
    ])).toEqual(true);
});
