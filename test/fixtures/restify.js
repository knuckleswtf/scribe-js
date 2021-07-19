const restify = require('restify');
const server = restify.createServer();
const handlers = require('./handlers');

/**
 * @bodyParam {string} param required
 */
server.post('/files/no-file', () => null);
/**
 * @bodyParam {file} a_file required
 */
server.post('/files/top-level-file', () => null);
/**
 * @bodyParam {object} data
 * @bodyParam {string} data.thing
 * @bodyParam {file} data.a_file
 */
server.post('/files/nested-file', () => null);