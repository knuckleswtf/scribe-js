const restify = require('restify');
const plugins = require('restify').plugins;
const server = restify.createServer();

const handlers = [
    (req, res) => {},
    (req, res) => {}
];

server.get('/get-string', handlers[0]);

server.post({path: '/post-object', name: 'sth'}, handlers[1]);

module.exports = handlers;