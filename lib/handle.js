const fs = require('fs');
const { logger } = require('./logger');
const config = require('../config');
const handlerTypes = require('../lib/type/handler').types;
const handlerTypeList = require('../lib/type/handler').typeList;
const { CommandHandler } = require('../lib/type/handler');

const cmdHandlers = {};
const ntcHandlers = [];
const reqHandlers = [];
const whkHandlers = [];
const bltHandlers = [];

const registeredHandlers = {};

for (const type of handlerTypeList) {
  registeredHandlers[type] = [];
}
registeredHandlers[handlerTypes.commandType] = {};

const cmdAliasToName = {};
const _cmdNameAndDescs = [];

const preHandlerData = {
  help: _cmdNameAndDescs,
};

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

// _registerCommands();
// _registerWebHooks();
// _registerBlackList();
registerHandlers();

registerCommand(helpHandler);

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
        default:
          break;
      }
    });
  });
}

function _registerCommands() {
  const modules = fs.readdirSync('handler/cmdHandler');
  modules.forEach((mdl) => {
    try {
      const importedModule = require(`../handler/cmdHandler/${mdl}`);
      const handlerName = importedModule.name;
      const handlerAliases = importedModule.alias;
      const handlerDesc = importedModule.desc;
      let { handler } = importedModule;
      if (!handler) {
        try {
          handler = importedModule.preHandler(preHandlerData[handlerName]);
        } catch (e) {
          throw Error('No handler exported.');
        }
      }
      if (handlerName in cmdHandlers) {
        logger.warn(`Already registered command ${handlerName}.`);
        logger.warn(`Skipped ${mdl}.`);
        return undefined;
      }
      cmdHandlers[handlerName] = handler;
      _cmdNameAndDescs.push({
        name: handlerName,
        desc: handlerDesc,
      });
      handlerAliases.forEach((handlerAlias) => {
        if (handlerAlias in cmdAliasToName) {
          logger.warn(
            `Alias "${handlerAlias}" has already registered by command "${cmdAliasToName[handlerAlias]}`);
        } else {
          cmdHandlers[handlerAlias] = handler;
          cmdAliasToName[handlerAlias] = handlerName;
        }
      });
      logger.debug(`Command "${handlerName}" registered.`);
    } catch (e) {
      logger.error(`Error registering command handler ${mdl}: ${e}`);
    }
    _cmdNameAndDescs.sort((a, b) => (a.name < b.name ? -1 : 1));
  });
}

function _registerWebHooks() {
  const modules = fs.readdirSync('handler/webhookHandler');
  modules.forEach((mdl) => {
    try {
      const importedModule = require(`../handler/webhookHandler/${mdl}`);
      const handlerName = importedModule.name;
      const { handler } = importedModule;
      whkHandlers.push(handler);
      logger.debug(`Webhook "${handlerName}" registered.`);
    } catch (e) {
      logger.error(`Error registering webhook handler ${mdl}: ${e}`);
    }
  });
}

function _registerBlackList() {
  const modules = fs.readdirSync('handler/blacklistHandler');
  modules.forEach((mdl) => {
    try {
      const importedModule = require(`../handler/blacklistHandler/${mdl}`);
      const handlerName = importedModule.name;
      const { handler } = importedModule;
      bltHandlers.push(handler);
      logger.debug(`Blacklist "${handlerName}" registered.`);
    } catch (e) {
      logger.error(`Error registering blacklist handler ${mdl}: ${e}`);
    }
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
      _handleCommand(session).catch((error) => {
        logger.info(error.toString());
      });
    },
    (blockMessage) => {
      logger.warn(blockMessage.toString());
    },
  );
  // });
}

// resolve('not supposed to appear');
// reject('not handled');
// if (_handleNotice(msgJson, ws))
//   resolve('handled');
// if (_handleRequest(msgJson, ws))
//   resolve('handled');
// reject('not handled');

// _xxxCommand should return true if matched,
// return false if not processed.
function _handleCommand(session) {
  return new Promise((resolve, reject) => {
    config.commandPrefix.forEach((prefix) => {
      if (session.post_type === 'message'
        && session.message.startsWith(prefix)
        && session.message.replace(prefix, '').length !== 0) {
        const cmdName = session.message.split(' ')[0].slice(1);

        if (cmdName in registeredHandlers[handlerTypes.commandType]) {
          const handler = registeredHandlers[handlerTypes.commandType][cmdName];
          handler.handle(session);
          logger.info(`Command "${cmdName}" handled.`);
          resolve('handled');
        } else if (cmdName in cmdAliasToName) {
          const handler = registeredHandlers[handlerTypes.commandType][cmdAliasToName[cmdName]];
          handler.handle(session);
          logger.info(`Command "${cmdAliasToName[cmdName]}" handled.`);
          resolve('handled');
        } else if ('*' in registeredHandlers[handlerTypes.commandType]) {
          const handler = registeredHandlers[handlerTypes.commandType]['*'];
          handler.handle(session);
          logger.info('Command "*" handled.');
          resolve('handled');
        }
      }
    });
    reject(`Not a command: "${session.message}"`);
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
  cmdHandlers,
  ntcHandlers,
  reqHandlers,
  whkHandlers,
  handleMessage,
  handlePayload,
};
