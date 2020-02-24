const fs = require('fs');
const { logger } = require('./logger');
const config = require('../config');
const handlerTypes = require('../lib/type/handler').types;
const handlerTypeList = require('../lib/type/handler').typeList;
const { CommandHandler } = require('../lib/type/handler');

const cmdHandlers = {};

const registeredHandlers = {};

for (const type of handlerTypeList) {
  registeredHandlers[type] = [];
}
registeredHandlers[handlerTypes.commandType] = {};

const cmdAliasToName = {};

// TODO: Blacklist: link to consistent data
const _blackList = [123456];

// Combine .help CommandHandler

const helpHandler = new CommandHandler('help', [], '使用手册', (session) => {
  const valueList = [];
  let nameDescList = [];
  for (const key in registeredHandlers[handlerTypes.commandType]) {
    valueList.push(registeredHandlers[handlerTypes.commandType][key]);
  }
  nameDescList = valueList.map((handler) => {
    return {
      name: handler.name,
      desc: handler.desc,
    };
  });
  nameDescList.sort((a, b) => (a.name < b.name ? -1 : 1));
  let message = '';
  for (const data of nameDescList) {
    message += `.${data.name} ${data.desc}\n`;
  }
  message = message.trim();
  session.send(message);
});

const adminHandler = new CommandHandler('admin', [], '管理员命令', (session) => {
  const valueList = [];
  let nameDescList = [];
  for (const key in registeredHandlers[handlerTypes.commandType]) {
    const handler = registeredHandlers[handlerTypes.commandType][key];
    if (handler.needAdmin) {
      valueList.push(handler);
    }
  }
  nameDescList = valueList.map((handler) => {
    return {
      name: handler.name,
      desc: handler.desc,
    };
  });
  nameDescList.sort((a, b) => (a.name < b.name ? -1 : 1));
  let message = '';
  for (const data of nameDescList) {
    message += `.${data.name} ${data.desc}\n`;
  }
  message = message.trim();
  session.send(message);
});
adminHandler.needAdmin = true;

registerHandlers();

registerCommand(helpHandler);
registerCommand(adminHandler);

function registerCommand(handler) {
  if (handler.name in cmdHandlers) {
    logger.warn(`Already registerd command ${handler.name}`);
    return undefined;
  }
  registeredHandlers[handlerTypes.commandType][handler.name] = handler;
  handler.alias.forEach((alias) => {
    if (alias in cmdAliasToName) {
      logger.error(
        `Alias "${alias}" has already registered by command "${cmdAliasToName[alias]} as alias.`);
    } else if (alias in registeredHandlers[handlerTypes.commandType]) {
      logger.error(
        `Alias "${alias}" has already registered by command "${alias} as command name.`);
    } else {
      cmdAliasToName[alias] = handler.name;
    }
  });
  logger.debug(`Command "${handler.name}" registered.`);
}

function registerWebhook(handler) {
  registeredHandlers[handlerTypes.webhookType].push(handler);
  logger.debug(`Webhook handler "${handler.name}" registered.`);
}

function registerRequest(handler) {
  registeredHandlers[handlerTypes.requestType].push(handler);
  logger.debug(`Request handler "${handler.name}" registered.`);
}

function registerNotice(handler) {
  registeredHandlers[handlerTypes.noticeType].push(handler);
  logger.debug();
}

function registerBlackList(handler) {
  registeredHandlers[handlerTypes.blackType].push(handler);
  logger.debug(`Blacklist handler "${handler.name}" registered.`);
}

function registerOther(handler) {
  registeredHandlers[handlerTypes.otherType].push(handler);
  logger.debug(`Other handler "${handler.name}" registered.`);
}

function registerHandlers() {
  const modules = fs.readdirSync('handler');
  modules.forEach((mdl) => {
    handlerList = require(`../handler/${mdl}`);
    handlerList.forEach((handler) => {
      switch (handler.type) {
        case handlerTypes.commandType:
          registerCommand(handler);
          break;
        case handlerTypes.noticeType:
          registerNotice(handler);
          break;
        case handlerTypes.requestType:
          registerRequest(handler);
          break;
        case handlerTypes.webhookType:
          registerWebhook(handler);
          break;
        case handlerTypes.blackType:
          registerBlackList(handler);
          break;
        case handlerTypes.otherType:
          registerOther(handler);
          break;
        default:
          break;
      }
    });
  });
}

function handlePayload(request, ws) {
  registeredHandlers[handlerTypes.webhookType].forEach((handler) => {
    try {
      handler.handle(request, ws);
    } catch (e) {
      logger.debug(e.toString());
    }
  });
}

function handleMessage(session) {
  _handleGlobal(session).then(
    (result) => {
      if (result) {
        logger.info(result);
      }
    },
    (error) => {
      logger.warn(error.toString());
    },
  );
}

function _handleGlobal(session) {
  // return new Promise((resolve, reject) => {
  return callBlackListHandler(session).then(
    () => {
      callCommonHandler(session);
      _handleCommand(session).catch((error) => {
        logger.error(error.toString());
      });
    },
    (blockMessage) => {
      logger.warn(blockMessage.toString());
    },
  );
  // });
}

function callCommonHandler(session) {
  [
    handlerTypes.requestType,
    handlerTypes.noticeType,
    handlerTypes.otherType].forEach(async (handlerType) => {
    if (handlerType !== handlerTypes.commandType) {
      registeredHandlers[handlerType].forEach((handler) => {
        return new Promise((resolve, reject) => {
          handler.handle(session);
          logger.info(
            `Message ${session.message} handled by ${handlerType} handler ${handler.name}.`);
          resolve();
        }).catch((error) => {
          logger.error(error.toString());
        });
      });
    }
  });
}

function _handleCommand(session) {
  return new Promise((resolve, reject) => {
    config.commandPrefix.forEach((prefix) => {
      if (session.post_type === 'message'
        && session.message.startsWith(prefix)
        && session.message.replace(prefix, '').length !== 0) {
        const cmdName = session.message.split(' ')[0].slice(1);

        if (cmdName in registeredHandlers[handlerTypes.commandType]) {
          const handler = registeredHandlers[handlerTypes.commandType][cmdName];
          if (handler.needAdmin) {
            const adminList = config.admin;
            if (adminList.length !== 0
              && adminList.indexOf(session.user_id) === -1) {
              logger.info(
                `Command ${handler.name} needs admin privilege, when user ${session.user_id} is not admin.`);
              return undefined;
            }
          }
          handler.handle(session).then(() => {
            logger.info(`Command "${cmdName}" handled.`);
            resolve('handled');
          }, (error) => {
            reject(error);
          });
        } else if (cmdName in cmdAliasToName) {
          const handler = registeredHandlers[handlerTypes.commandType][cmdAliasToName[cmdName]];
          handler.handle(session).then(() => {
            logger.info(`Command "${cmdAliasToName[cmdName]}" handled.`);
            resolve('handled');
          }, (error) => {
            reject(error);
          });
        } else if ('*' in registeredHandlers[handlerTypes.commandType]) {
          const handler = registeredHandlers[handlerTypes.commandType]['*'];
          handler.handle(session).then(() => {
            logger.info('Command "*" handled.');
            resolve('handled');
          }, (error) => {
            reject(error);
          });
        }
      }
    });
  });
}

function isBlackUserMessage(msgJSon) {
  return _blackList.indexOf(msgJSon.user_id) !== -1;
}

function callBlackListHandler(_session) {
  return new Promise((resolve, reject) => {
    // resolve('OK');
    if (isBlackUserMessage(_session.msgJson)) {
      registeredHandlers[handlerTypes.blackType].forEach((handler) => {
        handler.handle(_session);
      });
      reject(`Blocked user ${_session.user_id}: ${_session.message}`);
    } else {
      resolve();
    }
  });
}

module.exports = {
  handleMessage,
  handlePayload,
};
