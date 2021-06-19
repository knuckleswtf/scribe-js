const restify = require('restify');
const server = restify.createServer();
const handlers = require('./handlers');

// --- NB: if you reorder this file and the line numbers of the next two lines change,
// update the feature tests or else they will fail!

server.get('/get-string', handlers[0]);

server.post({path: '/post-object', name: 'sth'}, handlers[1]);

module.exports = handlers;