const { CommandHandler } = require('../lib/type/handler');
const { db } = require('../lib/database');
const { OtherHandler } = require('../lib/type/handler');
const { logger } = require('../lib/logger');
const schedule = require('node-schedule');

let groupLastUser = {};

const blockCountDbKey = 'KnockBlockCount';
const blockLeftKey = 'KnockBlockLeft';

// blockCountDb: [group][user]: count

const scheduleTaskAtEight = schedule.scheduleJob('8 * * *', async () => {
  await db.put(blockLeftKey, []);
  logger.info('KBR refreshed.');
});

const scheduleTaskAtTwenty = schedule.scheduleJob('20 * * *', async () => {
  await db.put(blockLeftKey, []);
  logger.info('KBR refreshed.');
});

async function initBlockLeftData(groupId, userId) {
  try {
    const blockLeftDict = await db.get(blockLeftKey);
    if (blockLeftDict[groupId]) {
      if (blockLeftDict[groupId][userId] === undefined) {
        blockLeftDict[groupId][userId] = 3;
      }
    } else {
      blockLeftDict[groupId] = {};
      blockLeftDict[groupId][userId] = 3;
    }
    await db.put(blockLeftKey, blockLeftDict);
    return blockLeftDict;
  } catch (e) {
    if (e.notFound) {
      const blockLeftDict = {};
      blockLeftDict[groupId] = {};
      blockLeftDict[groupId][userId] = 3;
      await db.put(blockLeftKey, blockLeftDict);
      return blockLeftDict;
    }
    throw e;
  }
}

async function getBlockLeft(groupId, userId) {
  const blockLeftDict = await initBlockLeftData(groupId, userId);
  return blockLeftDict[groupId][userId];
}

async function decBlockLeft(groupId, userId) {
  const blockLeftDict = await initBlockLeftData(groupId, userId);
  blockLeftDict[groupId][userId] -= 1;
  await db.put(blockLeftKey, blockLeftDict);
}

async function initBlockData(groupId, userId) {
  try {
    const blockDict = await db.get(blockCountDbKey);
    if (blockDict[groupId]) {
      if (blockDict[groupId][userId] === undefined) {
        blockDict[groupId][userId] = 0;
      }
    } else {
      blockDict[groupId] = {};
      blockDict[groupId][userId] = 0;
    }
    await db.put(blockCountDbKey, blockDict);
    return blockDict;
  } catch (e) {
    if (e.notFound) {
      const blockDict = {};
      blockDict[groupId] = {};
      blockDict[groupId][userId] = 0;
      await db.put(blockCountDbKey, blockDict);
      return blockDict;
    } else {
      throw e;
    }
  }
}

async function addBlock(groupId, userId) {
  const blockDict = await initBlockData(groupId, userId);
  blockDict[groupId][userId] += 1;
  await db.put(blockCountDbKey, blockDict);
}

async function subBlock(groupId, userId) {
  const blockDict = await initBlockData(groupId, userId);
  if (blockDict[groupId][userId] !== 0) {
    blockDict[groupId][userId] -= 1;
  }
  await db.put(blockCountDbKey, blockDict);
}

async function getBlock(groupId, userId) {
  const blockDict = await initBlockData(groupId, userId);
  return blockDict[groupId][userId];
}

const recordHandler = new OtherHandler('KBRecorder', async (session) => {
  if (!session.group_id) {
    return undefined;
  }
  if (groupLastUser[session.group_id] === undefined) {
    groupLastUser[session.group_id] = [];
  }
  if (groupLastUser[session.group_id].length < 2) {
    groupLastUser[session.group_id].push(session.user_id);
  } else {
    groupLastUser[session.group_id] = [
      groupLastUser[session.group_id][1],
      session.user_id,
    ];
  }
});

const cmz = new CommandHandler('cmz', '抽闷砖', '获得闷砖', async (session) => {
  if (session.message_type !== 'group') {
    return undefined;
  }
  const groupId = session.group_id;
  const userId = session.user_id;

  try {
    let blockLeft = await getBlockLeft(groupId, userId);
    if (blockLeft === 0) {
      const userBlock = await getBlock(groupId, userId);
      session.send(
        `[CQ:at,qq=${userId}] 你的闷砖配额已经用光了！去催獭獭加快进度！\n目前你有${userBlock}块闷砖。`);
    } else {
      let userBlock = await getBlock(groupId, userId);
      if (userBlock === 24) {
        session.send(`[CQ:at,qq=${userId}] 你背着24块闷砖还不够重吗？敲几块再抽！`);
      } else {
        await decBlockLeft(groupId, userId);
        await addBlock(groupId, userId);
        userBlock = await getBlock(groupId, userId);
        blockLeft = await getBlockLeft(groupId, userId);
        session.send(
          `[CQ:at,qq=${userId}] 呐~刚烧好的闷砖🧱\n目前你有${userBlock}块闷砖。\n獭獭砖厂剩余配额数：${blockLeft}块。`);
      }
    }
  } catch (e) {
    session.send('操作失败');
    throw e;
  }
});

const qmz = new CommandHandler('qmz', '敲闷砖', '使用闷砖', async (session) => {
  try {
    if (session.message_type !== 'group') {
      return undefined;
    }
    const groupId = session.group_id;
    const userId = session.user_id;

    const userBlockCount = await getBlock(groupId, userId);
    if (userBlockCount === 0) {
      session.send(`[CQ:at,qq=${userId}] 你已经没有闷砖了！`);
    } else {
      await subBlock(groupId, userId);
      const targetId = groupLastUser[groupId][0];
      if (targetId === userId) {
        session.api.set_group_ban(session.ws, groupId, userId, 60);
        session.send(`[CQ:at,qq=${userId}] 对着自己脑袋狠狠来了一记闷砖！`);
      } else if (parseInt(Math.random() * 10, 10) >= 5) {
        session.api.set_group_ban(session.ws, groupId, targetId, 60);
        session.send(`[CQ:at,qq=${userId}] 对 [CQ:at,qq=${targetId}] 狠狠来了一记闷砖！`);
      } else {
        session.api.set_group_ban(session.ws, groupId, userId, 60);
        session.send(
          `[CQ:at,qq=${userId}] 不小心被发现了！被 [CQ:at,qq=${targetId}] 夺走了闷砖并狠狠来了一记！`);
      }
    }
  } catch (e) {
    session.send('操作失败');
    throw e;

  }
});

// const qmz = new CommandHandler('敲闷砖', '使用闷砖', (session) => {})

module.exports = [cmz, qmz, recordHandler];
