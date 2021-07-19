'use strict';

process.env.SCRIBE_GENERATE = "1";
process.env.SCRIBE_TEST = '1';

const path = require("path");
const scribe = require('../../dist/index');
const { mockConfig } = require('../utils');

describe("Route extraction", () => {
    beforeEach(function () {
        const decache = require('decache');
        decache('require-in-the-middle');

        decache(path.resolve(__dirname, '../../frameworks/restify/src/decorator'));
        decache('restify');
        decache('restify/lib/router');
        decache(path.resolve(__dirname, '../fixtures/restify.routes.js'));

        decache('express');
        decache(path.resolve(__dirname, '../../frameworks/express/src/decorator'));
        decache(path.resolve(__dirname, '../fixtures/express.routes.js'));

        spyOn(scribe, 'generate');
    });

    it('can extract Express routes', async () => {
        const expressGenerate = require('../../frameworks/express/src/cli/generate');
        const expressAppPath = path.resolve(__dirname, '../fixtures/express.routes.js');
        const handlers = require('../fixtures/handlers');
        await expressGenerate({config: mockConfig(), app: expressAppPath});

        expect(scribe.generate).toHaveBeenCalledTimes(1);
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
        const actualRoutes = scribe.generate.calls.argsFor(0)[0];
        expect(actualRoutes).toHaveSize(expectedRoutes.length);
        expectedRoutes.forEach(
            r => expect(actualRoutes).toContain(jasmine.objectContaining(r))
        );
    });

    it('can extract Restify routes', async () => {
        const restifyServerPath = path.resolve(__dirname, '../fixtures/restify.routes.js');
        const handlers = require('../fixtures/handlers');
        const restifyGenerate = require('../../frameworks/restify/src/cli/generate');
        await restifyGenerate({config: mockConfig(), server: restifyServerPath});

        expect(scribe.generate).toHaveBeenCalledTimes(1);
        const expectedRoutes = [
            {
                uri: 'get-string',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [restifyServerPath, 8],
            },
            {
                uri: 'post-object',
                httpMethods: ['POST'],
                handler: handlers[1],
                declaredAt: [restifyServerPath, 10],
            },
            {
                uri: 'api/action1',
                httpMethods: ['GET'],
                handler: handlers[0],
                declaredAt: [restifyServerPath, 17],
            },
            {
                uri: 'api/action2',
                httpMethods: ['GET'],
                handler: handlers[1],
                declaredAt: [restifyServerPath, 23],
            },
        ];
        const actualRoutes = scribe.generate.calls.argsFor(0)[0];
        expect(actualRoutes).toHaveSize(expectedRoutes.length);
        expectedRoutes.forEach(
            (r, i) => expect(actualRoutes[i]).toEqual(jasmine.objectContaining(r))
        );
    });
});
