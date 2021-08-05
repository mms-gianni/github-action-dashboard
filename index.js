try {
    const { resolve } = require('path');
    const history = require('connect-history-api-fallback');
    const express = require('express');
    const app = express();
    const PORT = process.env.PORT || 8080
    const server = require('http').createServer(app);

    const configureAPI = require('./configure');


    if (process.env.GITHUB_APP_WEBHOOK_SECRET) {
        console.log('webhook listening on /webhook');

        const { Webhooks, createNodeMiddleware } = require("@octokit/webhooks");
        const github = require('./github');
    
        const webhooks = new Webhooks({
            secret: process.env.GITHUB_APP_WEBHOOK_SECRET,
        });
    
        webhooks.on('workflow_run', ({ id, name, payload }) => {
            console.log(`workflow_run received id: ${id}, name: ${name}`, payload);
            github.mergeRuns([{
                runId: payload.workflow_run.id,
                repo: payload.workflow_run.repository.name,
                owner: payload.workflow_run.repository.owner.login,
                workflowId: payload.workflow_run.workflow_id,
                runNumber: payload.workflow_run.run_number,
                workflow: payload.workflow_run.name,
                branch: payload.workflow_run.head_branch,
                sha: payload.workflow_run.head_sha,
                message: payload.workflow_run.head_commit.message,
                committer: payload.workflow_run.head_commit.committer.name,
                status: payload.workflow_run.status === 'completed' ? payload.workflow_run.conclusion : payload.workflow_run.status,
                createdAt: payload.workflow_run.created_at,
                updatedAt: payload.workflow_run.updated_at
            }]);
        });
        
        const middleware = createNodeMiddleware(webhooks, { path: "/webhook" });
        app.use('/webhook', middleware);
        //app.all('/webhook', webhooks.middleware(req, res));

    }


    // API
    configureAPI.before(app);
    configureAPI.after(app, server);

    // UI
    const publicPath = resolve(__dirname, './client/dist');
    const staticConf = { maxAge: '1y', etag: false };

    app.use(history());
    app.use(express.static(publicPath, staticConf));

    app.get('/', function (req, res) {
        res.render(path.join(__dirname + '/client/dist/index.html'))
    });

    // Go
    server.listen(PORT, () => console.log(`Action Dashboard running on port ${PORT}`));
}
catch (e) {
    console.error('Error on startup');
    console.error(e);
}
