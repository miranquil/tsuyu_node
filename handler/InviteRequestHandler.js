const { RequestHandler } = require('../lib/type/handler');
const { CommandHandler } = require('../lib/type/handler');
const { db } = require('../lib/database');
const api = require('../lib/api');
const { logger } = require('../lib/logger');
const { admin } = require('../config');

const friendInviteAcceptKey = 'accept_friend';
const groupInviteAcceptKey = 'accept_group';

const tmpAcceptFriendList = [];
const tmpAcceptGroupList = [];

const friendInviteRequestHandler = new RequestHandler('friendInvite',
  async (session) => {
    if (session.msgJson.request_type === 'friend') {
      const { flag, user_id } = session.msgJson;
      if (admin.indexOf(user_id) !== -1
        || tmpAcceptFriendList.indexOf(user_id) !== -1) {
        api.set_friend_add_request(session.ws, flag, true);
        logger.info(`Accept friend invitation of ${user_id} by admin set.`);
      } else {
        const approve = await getData(friendInviteAcceptKey);
        api.set_friend_add_request(session.ws, flag, approve);
        if (approve) {
          logger.info(`Accept friend invitation of ${user_id} by default.`);
        } else {
          logger.info(`Reject friend invitation of ${user_id} by default.`);
        }
      }
    }
  });

const groupInviteRequestHandler = new RequestHandler('groupInvite',
  async (session) => {
    if (session.msgJson.request_type === 'group' && session.msgJson.sub_type === 'invite') {
      const { flag, sub_type, group_id, user_id } = session.msgJson;
      if (admin.indexOf(user_id) !== -1
        || tmpAcceptGroupList.indexOf(group_id) !== -1) {
        api.set_group_add_request(session.ws, flag, sub_type, true);
        logger.info(`Accept group ${group_id} invitation of ${user_id} by admin set.`);
      } else {
        const approve = await getData(groupInviteAcceptKey);
        api.set_group_add_request(session.ws, flag, sub_type, approve);
        if (approve) {
          logger.info(`Accept group ${group_id} invitation of ${user_id} by default.`);
        } else {
          logger.info(`Reject group ${group_id} invitation of ${user_id} by default.`);
        }
      }
    }
  });

const friendInviteCommandHandler = new CommandHandler('accept_friend', [],
  '临时允许好友请求', async (session) => {
    if (session.params.length < 2) {
      session.send(`临时允许好友请求
    命令格式：.accept_friend [user_id] [on/off]`);
      return undefined;
    }
    let targetUserId;
    try {
      targetUserId = parseInt(session.params[0], 10);
    } catch (e) {
      session.send('非法参数');
      return undefined;
    }
    if (['on', 'off'].indexOf(session.params[1]) === -1) {
      session.send('非法参数');
      return undefined;
    }
    if (session.params[1] === 'on') {
      if (tmpAcceptFriendList.indexOf(targetUserId) !== -1) {
        session.send(`已经设置同意用户${targetUserId}的好友请求！`);
      } else {
        tmpAcceptFriendList.push(targetUserId);
        session.send(`成功设置同意用户${targetUserId}的好友请求！`);
      }
    } else if (tmpAcceptFriendList.indexOf(targetUserId) === -1) {
      session.send(`已经取消同意用户${targetUserId}的好友请求！`);
    } else {
      tmpAcceptFriendList.splice(tmpAcceptFriendList.indexOf(targetUserId),
        1);
      session.send(`成功取消同意用户${targetUserId}的好友请求！`);
    }
  });

const groupInviteCommandHandler = new CommandHandler('accept_group', [],
  '临时允许群邀请', async (session) => {
    if (session.params.length < 2) {
      session.send(`临时允许群邀请
    命令格式：.accept_group [group_id] [on/off]`);
      return undefined;
    }
    let targetGroupId;
    try {
      targetGroupId = parseInt(session.params[0], 10);
    } catch (e) {
      session.send('非法参数');
      return undefined;
    }
    if (['on', 'off'].indexOf(session.params[1]) === -1) {
      session.send('非法参数');
      return undefined;
    }
    if (session.params[1] === 'on') {
      if (tmpAcceptGroupList.indexOf(targetGroupId) !== -1) {
        session.send(`已经设置同意群${targetGroupId}的邀请！`);
      } else {
        tmpAcceptGroupList.push(targetGroupId);
        session.send(`成功设置同意群${targetGroupId}的邀请！`);
      }
    } else if (tmpAcceptGroupList.indexOf(targetGroupId) === -1) {
      session.send(`已经取消同意群${targetGroupId}的邀请！`);
    } else {
      tmpAcceptGroupList.splice(tmpAcceptGroupList.indexOf(targetGroupId),
        1);
      session.send(`成功取消同意群${targetGroupId}的邀请！`);
    }
  });

friendInviteCommandHandler.needAdmin = true;
groupInviteCommandHandler.needAdmin = true;

async function initData(key) {
  try {
    const data = await db.get(key);
    if (data === undefined) {
      await db.put(key, false);
      return false;
    }
    return data;
  } catch (e) {
    if (e.notFound) {
      const data = false;
      await db.put(key, data);
    } else {
      throw e;
    }
  }
}

async function getData(key) {
  await initData(key);
  const data = await db.get(key);
  return data;
}

module.exports = [
  friendInviteRequestHandler,
  friendInviteCommandHandler,
  groupInviteRequestHandler,
  groupInviteCommandHandler,
];
