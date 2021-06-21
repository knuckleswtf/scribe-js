const express = require('express');
const app = express();
const handlers = require('./handlers');

// --- NB: if you reorder this file and the line numbers of the next two lines change,
// update the feature tests or else they will fail!

app.get('/main-app', handlers[0]);
app.post('/main-app', handlers[1]);
app.route('/main-app-multi')
    .get(handlers[0])
    .post(handlers[1]);

const subApp = express();
subApp.get('/', handlers[0]);
subApp.post('/post', handlers[1]);

const subSubApp = express();
subSubApp.get('/', handlers[2]);
subApp.use('sub-app', subSubApp);

app.use('/sub-app', subApp);

const subRouter = express.Router();
subRouter.get('/', handlers[0]);
subRouter.post('/post', handlers[1]);

const subSubRouter = express.Router();
subSubRouter.get('/', handlers[2]);
subRouter.use('sub-router', subSubRouter);

app.use('/sub-router', subRouter);