const { logger } = require('../lib/logger');
const { spawn } = require('child_process');
const config = require('../config');
const { WebhookHandler } = require('../lib/type/handler');

const name = 'GitHub Pic-lib';

const handler = new WebhookHandler(name, (request, ws) => {
  const payload = request.body;
  const eventType = request.get('X-GitHub-Event');

  if (!eventType) {
    return undefined;
  }
  const repo = payload.repository;
  if (repo.full_name !== config.picLibRepoFullName) {
    return undefined;
  }

  if (eventType === 'push') {
    pullRepo();
  }
});

async function pullRepo() {
  logger.info('Received push from repository, pulling...');
  const s = spawn('sh', [`${process.cwd()}/public/pic-lib/update.sh`], {
    cwd: `${process.cwd()}/public/pic-lib`,
  });
  s.stderr.on('data', (data) => {
    logger.error(`${data}`);
  });
  logger.info('Pic-lib updated.');
}

module.exports = [handler];
