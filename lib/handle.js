const fs = require('fs');
const { logger } = require('./logger');
const config = require('../config');

const cmdHandlers = {};
const ntcHandlers = [];
const reqHandlers = [];
const whkHandlers = [];
const bltHandlers = [];

const cmdAliasToName = {};
const _cmdNameAndDescs = [];

const preHandlerData = {
  help: _cmdNameAndDescs,
};

// TODO: Blacklist: link to consistent data
const _blackList = [123456];

_registerCommands();
_registerWebHooks();
_registerBlackList();

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
        logger.warn(`Already registered command $${handlerName}.`);
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
  whkHandlers.forEach((handler) => {
    try {
      handler(request, ws);
    } catch (e) {
      logger.debug(e.toString());
    }
  });
}

// async function handlePayload(request, ws) {
//   whkHandlers.forEach((handler) => {
//     new Promise((resolve, reject) => {
//       try {
//         await handler(request, ws);
//         resolve('resolved');
//       } catch (e) {
//         console.log('rejecting');
//         reject(e);
//       }
//     }).then(
//       () => {
//       },
//       (error) => {
//         console.log('got error');
//         log.debug(error.toString());
//       },
//     );
//   });
// }

async function handleMessage(session) {
  _handleGlobal(session).then(
    (result) => {
      logger.info(result);
    },
    (error) => {
      logger.debug(error);
    },
  );
}

function _handleGlobal(session) {
  return new Promise((resolve, reject) => {
    getBlackListHandler(session).then(
      () => {
        _handleCommand(session).catch((error) => {
          logger.debug(error);
        });
      },
      (error) => {
        reject(error);
      },
    );
  });
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
        if (cmdName in cmdHandlers) {
          cmdHandlers[cmdName](session);
          logger.info(`Command "${cmdName}" handled.`);
          resolve('handled');
        } else if ('*' in cmdHandlers) {
          cmdHandlers['*'](session);
          logger.info('Command "*" handled.');
          resolve('handled');
        }
      }
    });
    reject(`Not a command: "${session.message}"`);
  });
}

// use async way
function _handleNotice(msgJson, ws) {
  return undefined;
}

function _handleRequest(msgJson, ws) {
  return undefined;
}

function getBlackListHandler(_session) {
  return new Promise((resolve, reject) => {
    // resolve('OK');
    if (_blackList.indexOf(_session.msgJson.user_id) !== -1) {
      bltHandlers.forEach((handler) => {
        handler(_session);
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
