const restify = require('restify');
const server = restify.createServer();
const handlers = require('./handlers');

// --- NB: if you reorder this file and the line numbers of the next two lines change,
// update the feature tests or else they will fail!

server.get('/get-string', handlers[0]);

server.post({path: '/post-object', name: 'sth'}, handlers[1]);

/**
 * Some endpoint.
 *
 * @group 1. Group 1
 */
server.get('/api/action1', handlers[0]);


/**
 * @group 2. Group 2
 */
server.get('/api/action2', handlers[1]);