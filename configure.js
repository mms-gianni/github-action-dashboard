const path = require('path');
const runStatus = require('./runstatus');
const { createNodeMiddleware } = require("@octokit/webhooks");

// Handle when server is started from vue-cli vs root
if (path.basename(process.cwd()) === 'client') {
    require('dotenv').config({ path: path.resolve(process.cwd(), '../.env') });
}
else {
    require('dotenv').config()
}
const debug = require('debug')('action-dashboard:configure');
//debug(`environment`, process.env);

const bodyParser = require('body-parser')
const routes = require('./routes')


// Loads webhook support if GITHUB_APP_WEBHOOK_SECRET defined
const webhooks = require('./webhooks');
const middleware = createNodeMiddleware(webhooks, { path: "/webhook" });

module.exports = {
    webhooks,
    middleware,
    before: (app) => {
        app.use(bodyParser.json());
        app.use('/api', routes);
        //app.use('/webhook', middleware);
    },
    after: (app, server) => {
        // Attach socket.io to server
        app.use('/webhook', middleware);
        runStatus.init(server);
    }
}