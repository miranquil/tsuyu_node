const api = require('../../lib/api');
const { logger } = require('../../lib/logger');
const { get, put } = require('../../lib/database');
const { spawn } = require('child_process');
const { config } = require('../../config');

const name = 'GitHub webhook';
const keyOfUsers = 'githubWebhookBroadcastUsers';
const keyOfGroups = 'githubWebhookBroadcastGroups';

function handler(request, ws) {
  const payload = request.body;
  const eventType = request.get('X-GitHub-Event');
  let message = null;

  if (!eventType) {
    return undefined;
  }
  const repo = payload.repository;
  if (repo.full_name !== config.repoFullName) {
    return undefined;
  }
  if (eventType === 'ping') {
    message = payload.zen;
  } else if (eventType === 'push') {
    const pusherName = payload.pusher.name;
    message = `New push to ${repo.full_name}\n`;
    message += `Pusher: ${pusherName}\n`;
    message += `Ref ${payload.ref}\n`;
    message += 'Commits:\n';
    for (const commit of payload.commits) {
      message += `  ${commit.id.slice(0, 7)} ${commit.message}\n`;
    }
    message += `Check at ${payload.compare}`;
  } else if (eventType === 'pull_request') {
    const { action } = payload;
    const { number } = payload;
    const pr = payload.pull_request;
    const pusher = pr.user.login;
    if (action === 'opened') {
      message += `${pusher} opened a new pull request to ${repo.full_name}`;
      message += `#${number}:${pr.title}`;
    } else {
      message += `${pusher} ${action} PR#${number}:${pr.title}, state changed to ${pr.state}.\n`;
    }
    message += `Check at ${pr.url}\n`;
  } else if (eventType === 'star') {
    const { action } = payload;
    const { sender } = payload;
    if (action === 'created') {
      message = `${sender.login} started ${repo.full_name}`;
    } else if (action === 'deleted') {
      message = `${sender.login} canceled star of ${repo.full_name}`;
    }
  } else if (eventType === 'watch') {
    const { sender } = payload;
    message = `${sender.login} is watching ${repo.full_name} now`;
  } else if (eventType === 'issues') {
    const { action } = payload;
    const { issue } = payload;
    const { number } = issue;
    const pusher = issue.user.login;
    if (action === 'opened') {
      message = `${pusher} opened a new issue to ${repo.full_name}\n`;
      message += `#${number}:${issue.title}\n`;
    } else if (action === 'deleted') {
      message = `${pusher} ${action} issue#${number}:${issue.title}.\n`;
    } else {
      message = `${pusher} ${action} issue#${number}:${issue.title}, state changed to ${issue.state}.\n`;
    }
    message += `Check at ${issue.url}\n`;
  } else if (eventType === 'fork') {
    const { forkee } = payload;

    message = `${forkee.owner.login} forked ${repo.full_name} to ${forkee.full_name}`;
  } else if (eventType === 'gollum') {
    const { pages } = payload;
    const { sender } = payload;

    message = `${sender.login} updated wiki pages of ${repo.full_name}:\n`;
    for (const page of pages) {
      message += `${page.page_name}:${page.html_url}\n`;
    }
  } else {
    logger.warn(`Github event "${eventType}" is not implemented.`);
  }
  if (message) {
    message = message.trim();
    get(keyOfUsers, (userList) => {
      userList.forEach((userId) => {
        api.send_private_msg(ws, userId, message);
      });
    }).catch((error) => {
      logger.error(error);
    });

    get(keyOfGroups, (groupList) => {
      groupList.forEach((groupId) => {
        api.send_group_msg(ws, groupId, message);
      });
    }).catch((error) => {
      logger.error(error);
    });

    if (eventType === 'push') {
      pullRepo();
    }
  }
}

async function pullRepo() {
  logger.info('Received push from repository, pulling...');
  const s = spawn('sh', [`${process.cwd()}/build.sh`], {
    cwd: `${process.cwd()}`,
  });
  s.stderr.on('data', (data) => {
    logger.error(`${data}`);
  });
  logger.info('Auto re-deploy finished.');
}

module.exports = {
  name,
  handler,
  pullRepo,
};
