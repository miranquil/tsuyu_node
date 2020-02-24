const { CommandHandler } = require('../lib/type/handler');
const { db } = require('../lib/database');
const config = require('../config');

const statusCommandHandler = new CommandHandler('status', [], '系统状态',
  async (session) => {
    let acceptFriend;
    let acceptGroup;
    try {
      acceptFriend = await db.get('accept_friend');
    } catch (e) {
      if (e.notFound) {
        acceptFriend = false;
      } else {
        throw e;
      }
    }
    try {
      acceptGroup = await db.get('accept_group');
    } catch (e) {
      if (e.notFound) {
        acceptGroup = false;
      } else {
        throw e;
      }
    }
    const statusText = `露儿状态：
LevelDB:\t${db ? '✓' : '✗'}
命令前缀:\t${config.commandPrefix.join(' ')}
好友请求:\t${acceptFriend ? '接受' : '拒绝'}
群邀请:\t${acceptGroup ? '接受' : '拒绝'}`;
    session.send(statusText);
  });

module.exports = [statusCommandHandler];
