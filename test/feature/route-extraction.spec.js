const path = require("path");

process.env.SCRIBE_GENERATE = "1";

const scribe = require('../../dist/index');
const handlers = require('../fixtures/handlers');
const { mockConfig } = require('../utils');
const sinon = require('sinon');

describe("Route extraction", () => {
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
        const expressAppPath = path.resolve(__dirname, '../fixtures/express.routes.js');
        await generate({config: mockConfig(), app: expressAppPath});

        expect(stub.calledOnce).toEqual(true);
        const expectedRoutes = [
            {
                uri: '/main-app',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [expressAppPath, 8],
            },
            {
                uri: '/main-app',
                httpMethods: ['POST'],
                handler: handlers[1],
                declaredAt: [expressAppPath, 9],
            },
            {
                uri: '/main-app-multi',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [expressAppPath, 11],
            },
            {
                uri: '/main-app-multi',
                httpMethods: ['POST'],
                handler: handlers[1],
                declaredAt: [expressAppPath, 12],
            },
            {
                uri: '/sub-app',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [expressAppPath, 15],
            },
            {
                uri: '/sub-app/post',
                httpMethods: ['POST'],
                handler: handlers[1],
                declaredAt: [expressAppPath, 16],
            },
            {
                uri: '/sub-app/sub-app',
                httpMethods: ['GET'],
                handler: handlers[2],
                declaredAt: [expressAppPath, 19],
            },
            {
                uri: '/sub-router',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [expressAppPath, 25],
            },
            {
                uri: '/sub-router/post',
                httpMethods: ['POST'],
                handler: handlers[1],
                declaredAt: [expressAppPath, 26],
            },
            {
                uri: '/sub-router/sub-router',
                httpMethods: ['GET'],
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
        const restifyServerPath = path.resolve(__dirname, '../fixtures/restify.routes.js');
        await generate({config: mockConfig(), server: restifyServerPath});

        const actualRoutes = stub.getCall(0).args[0];
        console.log(actualRoutes);
        expect(stub.calledOnceWith([
            {
                uri: '/get-string',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [restifyServerPath, 8],
            },
            {
                uri: '/post-object',
                httpMethods: ['POST'],
                handler: handlers[1],
                declaredAt: [restifyServerPath, 10],
            },
            {
                uri: '/api/action1',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [restifyServerPath, 17],
            },
            {
                uri: '/api/action2',
                httpMethods: ['GET'],
                handler: handlers[1],
                declaredAt: [restifyServerPath, 23],
            },
        ])).toEqual(true);
    });
});
