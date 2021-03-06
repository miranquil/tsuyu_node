const fs = require('fs');
const { logger } = require('../lib/logger');
const config = require('../config');
const { CommandHandler } = require('../lib/type/handler');

const handler = new CommandHandler('aura', [], '云吸龙娘',
  async (session) => {
    fs.readdir('public/pic-lib/aura', (err, fileList) => {
      if (err) {
        logger.error(err);
      } else {
        const imageList = fileList.filter((file) => {
          return !file.startsWith('.');
        });
        const fileIndex = parseInt(Math.random() * imageList.length, 10);
        if (imageList[fileIndex]) {
          session.send(
            `[CQ:image,file=http://${config.ip}:${config.port}/public/pic-lib/aura/${imageList[fileIndex]}]`);
        }
      }
    });
  });

module.exports = [handler];
