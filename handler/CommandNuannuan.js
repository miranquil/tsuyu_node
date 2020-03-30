const bent = require('bent');
const { CommandHandler } = require('../lib/type/handler');
const { db } = require('../lib/database');
const schedule = require('node-schedule');
const api = require('../lib/api');

const nn = new CommandHandler('nuannuan', ['nn', '暖暖'],
  '本周金蝶暖暖答案。使用reminder参数设置提醒。',
  async (session) => {
    if (session.params.length === 0) {
      const get = bent('http://nuannuan.yorushika.co:5000', 'GET', 'json', 200);
      const response = await get();
      session.send(response.content);
    } else if (session.params.length === 1) {
      if (session.params[0] !== 'reminder') {
        session.send('非法参数');
      } else {
        session.send(`提醒暖暖小助手
    命令格式：.nn reminder [on/off]
    针对当前会话（群/私聊）设置提醒。开启提醒者会在周五1600和周一0900收到提醒`);
      }
    } else if (session.params[0] !== 'reminder') {
      session.send('非法参数');
    } else if (['on', 'off'].indexOf(session.params[1]) === -1) {
      session.send('非法参数');
    } else {
      let dbKey;
      if (session.params[1] === 'on') {
        let dbData;
        if (session.message_type === 'group') {
          dbKey = 'nn_reminder_group';
          try {
            dbData = await db.get(dbKey);
          } catch (e) {
            if (e.notFound) {
              dbData = [];
            } else {
              throw e;
            }
          }
          if (dbData.indexOf(session.group_id) !== -1) {
            session.send('已经启用本群暖暖提醒');
          } else {
            dbData.push(session.group_id);
            await db.put(dbKey, dbData);
            session.send('成功启用本群暖暖提醒');
          }
        } else {
          dbKey = 'nn_reminder_private';
          try {
            dbData = await db.get(dbKey);
          } catch (e) {
            if (e.notFound) {
              dbData = [];
            } else {
              throw e;
            }
          }
          if (dbData.indexOf(session.user_id) !== -1) {
            session.send('已经启用个人暖暖提醒');
          } else {
            dbData.push(session.user_id);
            await db.put(dbKey, dbData);
            session.send('成功启用个人暖暖提醒');
          }
        }
      } else {
        let dbData;
        if (session.message_type === 'group') {
          dbKey = 'nn_reminder_group';
          try {
            dbData = await db.get(dbKey);
          } catch (e) {
            if (e.notFound) {
              dbKey = [];
            } else {
              throw e;
            }
          }
          if (dbData) {
            if (dbData.indexOf(session.group_id) === -1) {
              session.send('已经禁用本群暖暖提醒');
            } else {
              dbData.splice(dbData.indexOf(session.group_id), 1);
              await db.put(dbKey, dbData);
              session.send('成功禁用本群暖暖提醒');
            }
          }
        } else {
          dbKey = 'nn_reminder_private';
          try {
            dbData = await db.get(dbKey);
          } catch (e) {
            if (e.notFound) {
              dbData = [];
            } else {
              throw e;
            }
          }
          if (dbData.indexOf(session.user_id) === -1) {
            session.send('已经禁用个人暖暖提醒');
          } else {
            dbData.splice(dbData.indexOf(session.user_id), 1);
            await db.put(dbKey, dbData);
            session.send('成功禁用个人暖暖提醒');
          }
        }
      }
    }
  });

const scheduleTaskFri = schedule.scheduleJob('0 0 16 * * 5', async () => {
  let groupList;
  let privateList;
  try {
    groupList = await db.get('nn_reminder_group');
  } catch (e) {
    if (e.notFound) {
      groupList = [];
    } else {
      throw e;
    }
  }
  try {
    privateList = await db.get('nn_reminder_private');
  } catch (e) {
    if (e.notFound) {
      privateList = [];
    } else {
      throw e;
    }
  }
  groupList.forEach((groupId) => {
    const msg = '露儿暖暖提醒：本周暖暖已经开放挑战！';
    api.send_group_msg_http(groupId, msg);
  });
  privateList.forEach((userId) => {
    const msg = '露儿暖暖提醒：本周暖暖已经开放挑战！';
    api.send_private_msg_http(userId, msg);
  });
});

const scheduleTaskMon = schedule.scheduleJob('0 0 9 * * 1', async () => {
  let groupList;
  let privateList;
  try {
    groupList = await db.get('nn_reminder_group');
  } catch (e) {
    if (e.notFound) {
      groupList = [];
    } else {
      throw e;
    }
  }
  try {
    privateList = await db.get('nn_reminder_private');
  } catch (e) {
    if (e.notFound) {
      privateList = [];
    } else {
      throw e;
    }
  }
  groupList.forEach((groupId) => {
    const msg = '露儿暖暖提醒：本周暖暖将于明天下午1600过期，若未挑战请抓紧时间参与！';
    api.send_group_msg_http(groupId, msg);
  });
  privateList.forEach((userId) => {
    const msg = '露儿暖暖提醒：本周暖暖将于明天下午1600过期，若未挑战请抓紧时间参与！';
    api.send_private_msg_http(userId, msg);
  });
});

module.exports = [nn];
