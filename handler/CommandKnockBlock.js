const { CommandHandler } = require('../lib/type/handler');
const { db } = require('../lib/database');
const { OtherHandler } = require('../lib/type/handler');
const { logger } = require('../lib/logger');
const api = require('../lib/api');
const schedule = require('node-schedule');

let groupLastUser = {};

const blockCountDbKey = 'KnockBlockCount';
const blockFlagKey = 'KnockBlockLeft';
const blockImmuneKey = 'KnockBlockImmune';

// blockCountDb: [group][user]: count

const scheduleTaskAtEight = schedule.scheduleJob('0 0 8 * * *', async () => {
  await db.put(blockFlagKey, {});
  logger.info('KBR1 refreshed.');
});

const scheduleTaskAtTwenty = schedule.scheduleJob('0 0 20 * * *', async () => {
  await db.put(blockFlagKey, {});
  logger.info('KBR refreshed.');
});

async function initBlockImmuneData(groupId, userId) {
  try {
    const blockImmuneDict = await db.get(blockImmuneKey);
    if (blockImmuneDict[groupId]) {
      if (blockImmuneDict[groupId][userId] === undefined) {
        blockImmuneDict[groupId][userId] = false;
      }
    } else {
      blockImmuneDict[groupId] = {};
      blockImmuneDict[groupId][userId] = false;
    }
    await db.put(blockImmuneKey, blockImmuneDict);
    return blockImmuneDict;
  } catch (e) {
    if (e.notFound) {
      const blockImmuneDict = {};
      blockImmuneDict[groupId] = {};
      blockImmuneDict[groupId][userId] = false;
      await db.put(blockImmuneKey, blockImmuneDict);
      return blockImmuneDict;
    }
  }
}

async function getBlockImmuneData(groupId, userId) {
  const blockImmuneDict = await initBlockImmuneData(groupId, userId);
  return blockImmuneDict[groupId][userId];
}

async function setBlockImmuneData(groupId, userId, value) {
  const blockImmuneDict = await initBlockImmuneData(groupId, userId);
  blockImmuneDict[groupId][userId] = value;
  await db.put(blockImmuneKey, blockImmuneDict);
}

async function initBlockLeftData(groupId, userId) {
  try {
    const blockLeftDict = await db.get(blockFlagKey);
    if (blockLeftDict[groupId]) {
      if (blockLeftDict[groupId][userId] === undefined) {
        blockLeftDict[groupId][userId] = true;
      }
    } else {
      blockLeftDict[groupId] = {};
      blockLeftDict[groupId][userId] = true;
    }
    await db.put(blockFlagKey, blockLeftDict);
    return blockLeftDict;
  } catch (e) {
    if (e.notFound) {
      const blockLeftDict = {};
      blockLeftDict[groupId] = {};
      blockLeftDict[groupId][userId] = true;
      await db.put(blockFlagKey, blockLeftDict);
      return blockLeftDict;
    }
    throw e;
  }
}

async function getBlockFlag(groupId, userId) {
  const blockLeftDict = await initBlockLeftData(groupId, userId);
  return blockLeftDict[groupId][userId];
}

async function markBlockFlag(groupId, userId, flag = false) {
  const blockLeftDict = await initBlockLeftData(groupId, userId);
  blockLeftDict[groupId][userId] = flag;
  await db.put(blockFlagKey, blockLeftDict);
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

async function addBlock(groupId, userId, number = 1) {
  const blockDict = await initBlockData(groupId, userId);
  blockDict[groupId][userId] += number;
  await db.put(blockCountDbKey, blockDict);
}

async function subBlock(groupId, userId, number = 1) {
  const blockDict = await initBlockData(groupId, userId);
  if (blockDict[groupId][userId] !== 0) {
    blockDict[groupId][userId] -= number;
  }
  await db.put(blockCountDbKey, blockDict);
}

async function setBlock(groupId, userId, number) {
  const blockDict = await initBlockData(groupId, userId);
  blockDict[groupId][userId] = number;
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

const cmz = new CommandHandler('cmz', '抽闷砖', '获得闷砖（早晚八点刷新）',
  async (session) => {
    if (session.message_type !== 'group') {
      return undefined;
    }
    const groupId = session.group_id;
    const userId = session.user_id;

    const immuneFlag = await getBlockImmuneData(groupId, userId);
    if (immuneFlag) {
      session.send('必须解除免疫才能抽闷砖！');
      return undefined;
    }

    try {
      const blockLeft = await getBlockFlag(groupId, userId);
      if (blockLeft === false) {
        const userBlock = await getBlock(groupId, userId);
        session.send(
          `[CQ:at,qq=${userId}] 你已经抽过闷砖了！\n目前你有${userBlock}块闷砖。`);
      } else {
        const rdBLockCount = parseInt(Math.random() * 8, 10) + 1;
        await markBlockFlag(groupId, userId, false);
        await addBlock(groupId, userId, rdBLockCount);
        const userBlock = await getBlock(groupId, userId);
        session.send(
          `[CQ:at,qq=${userId}] 呐~刚烧好的${rdBLockCount}块闷砖🧱\n目前你有${userBlock}块闷砖。`);
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

    let immuneFlag = await getBlockImmuneData(groupId, userId);
    if (immuneFlag) {
      session.send('必须解除免疫才能敲闷砖！');
      return undefined;
    }

    const userBlockCount = await getBlock(groupId, userId);
    if (userBlockCount === 0) {
      session.send(`[CQ:at,qq=${userId}] 你已经没有闷砖了！`);
    } else {
      const targetId = groupLastUser[groupId][0];
      immuneFlag = await getBlockImmuneData(groupId, targetId);
      if (immuneFlag) {
        session.send(`[CQ:at,qq=${userId}]那单位对闷砖免疫`);
        return undefined;
      }
      if (targetId === userId) {
        await subBlock(groupId, userId);
        session.api.set_group_ban(session.ws, groupId, userId, 60);
        session.send(`[CQ:at,qq=${userId}] 对着自己脑袋狠狠来了一记闷砖！`);
      } else {
        const rndKey = parseInt(Math.random() * 100, 10);
        if (rndKey < 15) {
          await subBlock(groupId, userId);
          session.send(`[CQ:at,qq=${userId}] 手滑甩飞了闷砖！`);
        } else if (rndKey < 30) {
          await subBlock(groupId, userId);
          await addBlock(groupId, targetId);
          session.send(
            `[CQ:at,qq=${userId}] 没抓稳，闷砖掉在地上被 [CQ:at,qq=${targetId}] 捡走了！`);
        } else if (rndKey < 65) {
          const adminFlag = await api.get_group_member_info(groupId, targetId);
          if (['admin', 'owner'].indexOf(adminFlag.role) !== -1) {
            await subBlock(groupId, userId);
            session.send(`[CQ:at,qq=${userId}] 手里的闷砖突然变成了豆腐块！`);
          } else {
            await subBlock(groupId, userId);
            session.api.set_group_ban(session.ws, groupId, targetId, 60);
            session.send(
              `[CQ:at,qq=${userId}] 对 [CQ:at,qq=${targetId}] 狠狠来了一记闷砖！`);
          }
        } else if (rndKey < 75) {
          await subBlock(groupId, userId);
          session.api.set_group_ban(session.ws, groupId, targetId, 60);
          session.api.set_group_ban(session.ws, groupId, userId, 60);
          session.send(
            `[CQ:at,qq=${targetId}] 的头太硬了！闷砖反弹回去砸到了 [CQ:at,qq=${userId}] 的头上！`);
        } else {
          await subBlock(groupId, userId);
          session.api.set_group_ban(session.ws, groupId, userId, 60);
          session.send(
            `[CQ:at,qq=${userId}] 不小心被发现了！被 [CQ:at,qq=${targetId}] 夺走了闷砖并狠狠来了一记！`);
        }
      }
    }
  } catch (e) {
    session.send('操作失败');
    throw e;
  }
});

const immuneBlock = new CommandHandler('imz', [], '免疫闷砖', async (session) => {
  try {
    if (session.message_type === 'group') {
      const groupId = session.group_id;
      const userId = session.user_id;
      if (session.params.length === 0) {
        session.send(`免疫闷砖
    命令格式: .imz on/off
    激活免疫后将不会被其他人敲闷砖，但自身也将无法抽闷砖或敲闷砖。
    仅针对当前群有效，默认全员不免疫`);
      } else if (['on', 'off'].indexOf(session.params[0]) === -1) {
        session.send('非法参数');
      } else if (session.params[0] === 'on') {
        const immuneFlag = await getBlockImmuneData(groupId, userId);
        if (immuneFlag) {
          session.send(`[CQ:at,qq=${userId}]已经免疫闷砖`);
        } else {
          await setBlockImmuneData(groupId, userId, true);
          session.send(`[CQ:at,qq=${userId}]免疫闷砖成功`);
        }
      } else {
        const immuneFlag = await getBlockImmuneData(groupId, userId);
        if (immuneFlag === false) {
          session.send(`[CQ:at,qq=${userId}]已经解除免疫闷砖`);
        } else {
          await setBlockImmuneData(groupId, userId, true);
          session.send(`[CQ:at,qq=${userId}]解除免疫闷砖成功`);
        }
      }
    }
  } catch (e) {
    session.send('操作失败');
    throw e;
  }
});

const setBlockCommandHandler = new CommandHandler('set_block', '', '修改闷砖数',
  async (session) => {
    if (session.params.length === 0) {
      session.send(`管理员指令：修改成员闷砖数
    命令格式：.set_block [user_id] [group_id] num
    命令并不会检查用户ID和群号的有效性`);
    } else {
      let userId;
      let blockNum;
      let groupId;
      if (session.params.length === 1) {
        userId = session.user_id;
        blockNum = parseInt(session.params[0], 10);
        groupId = session.group_id;
      } else if (session.params.length === 2) {
        userId = parseInt(session.params[0], 10);
        blockNum = parseInt(session.params[1], 10);
        groupId = session.group_id;
      } else {
        userId = parseInt(session.params[0], 10);
        groupId = parseInt(session.params[1], 10);
        blockNum = parseInt(session.params[2], 10);
      }
      if (isNaN(blockNum) || isNaN(userId) || isNaN(groupId)) {
        session.send('非法参数');
      } else {
        try {
          await setBlock(groupId, userId, blockNum);
        } catch (e) {
          session.send('操作失败');
          throw e;
        }
        session.send('修改完成');
      }
    }
  })
;

setBlockCommandHandler.needAdmin = true;

module.exports = [cmz, qmz, immuneBlock, recordHandler, setBlockCommandHandler];
