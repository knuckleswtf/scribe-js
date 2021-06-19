const path = require("path");

process.env.SCRIBE_GENERATE = "1";

const sinon = require('sinon');
const scribe = require('../../dist/index');
const stub = sinon.stub(scribe, 'generate');

it('can extract restify routes', async () => {
    const generate = require('../../frameworks/restify/src/cli/generate');
    let restifyServerPath = path.resolve(__dirname, '../fixtures/restify.routes.js');
    generate({config: path.resolve(__dirname, '../../config.js'), server: restifyServerPath});

    const handlers = require('../fixtures/handlers');
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
