const { CommandHandler } = require('../lib/type/handler');
const { logger } = require('../lib/logger');
const { get, put } = require('../lib/database');

const handler = new CommandHandler('repository', ['repo'], '远程存储库事件监听',
  async (session) => {
    if (session.params.length === 0) {
      const message = `远程 Repository 事件监听
    参数：
    enable 激活个人/当前群事件监听
    disable 停用个人/当前群事件监听
    若为群消息，则会针对当前群进行操作。`;
      session.send(message);
      return undefined;
    }
    if (['enable', 'disable'].indexOf(session.params[0]) === -1) {
      session.send('非法参数');
      return undefined;
    }
    let targetKey = '';
    let targetValue = null;
    if (session.params[0] === 'enable') {
      if (session.group_id) {
        targetKey = 'githubWebhookBroadcastGroups';
        targetValue = session.group_id;
      } else {
        targetKey = 'githubWebhookBroadcastUsers';
        targetValue = session.user_id;
      }
      let targetData = null;
      get(targetKey, (result) => {
        if (Array.isArray(result)) {
          targetData = result;
        } else {
          targetData = [result];
        }
        if (targetData.indexOf(targetValue) !== -1) {
          if (session.group_id) {
            session.send(`已经激活群${targetValue}事件监听`);
          } else {
            session.send(`已经激活用户${targetValue}事件监听`);
          }
          return undefined;
        }
        targetData.push(targetValue);
        put(targetKey, targetData, () => {
          if (session.group_id) {
            session.send(`成功激活群${targetValue}事件监听`);
          } else {
            session.send(`成功激活用户${targetValue}事件监听`);
          }
        }).catch((error) => {
          throw error;
        });
      }).catch((error) => {
        if (error.notFound) {
          targetData = [targetValue];
          put(targetKey, targetData, () => {
            if (session.group_id) {
              session.send(`成功激活群${targetValue}事件监听`);
            } else {
              session.send(`成功激活用户${targetValue}事件监听`);
            }
          }).catch((error) => {
            throw error;
          });
        } else if (error) {
          logger.error(error);
          session.send('操作失败');
        }
      });
    } else {
      if (session.group_id) {
        targetKey = 'githubWebhookBroadcastGroups';
        targetValue = session.group_id;
      } else {
        targetKey = 'githubWebhookBroadcastUsers';
        targetValue = session.user_id;
      }
      let targetData = null;
      get(targetKey, (result) => {
        if (Array.isArray(result)) {
          targetData = result;
        } else {
          targetData = [result];
        }
        if (targetData.indexOf(targetValue) === -1) {
          if (session.group_id) {
            session.send(`已经停用群${targetValue}事件监听`);
          } else {
            session.send(`已经停用用户${targetValue}事件监听`);
          }
          return undefined;
        }
        targetData.splice(targetData.indexOf(targetValue), 1);
        put(targetKey, targetData, () => {
          if (session.group_id) {
            session.send(`成功停用群${targetValue}事件监听`);
          } else {
            session.send(`成功停用用户${targetValue}事件监听`);
          }
        }).catch((error) => {
          throw error;
        });
      }).catch((error) => {
        if (error.notFound) {
          targetData = [];
          put(targetKey, targetData, () => {
            if (session.group_id) {
              session.send(`成功停用群${targetValue}事件监听`);
            } else {
              session.send(`成功停用用户${targetValue}事件监听`);
            }
          }).catch((error) => {
            throw error;
          });
        } else if (error) {
          logger.error(error);
          session.send('操作失败');
        }
      });
    }
  });

module.exports = [handler];
