const path = require("path");

process.env.SCRIBE_GENERATE = "1";

it('can extract restify routes', async () => {
    const decorator = require('../../frameworks/restify');
    decorator();

    let restifyServerPath = '../fixtures/restify.routes';
    const handlers = require(restifyServerPath);

    expect(decorator.allRoutes).toHaveSize(2);
    expect(decorator.allRoutes[0]).toEqual({
        uri: '/get-string',
        methods: ['GET'],
        handler: handlers[0],
        declaredAt: [path.resolve(__dirname, restifyServerPath + '.js'), 10],
    });
    expect(decorator.allRoutes[1]).toEqual({
        uri: '/post-object',
        methods: ['POST'],
        handler: handlers[1],
        declaredAt: [path.resolve(__dirname, restifyServerPath + '.js'), 12],
    });
});
