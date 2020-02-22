const fs = require('fs');
const { logger } = require('../../lib/logger');
const config = require('../../config');

const name = 'meat';
const alias = [];
const desc = '深夜福利';

function handler(session) {
  fs.readdir('public/pic-lib/night', (err, fileList) => {
    if (err) {
      logger.error(err);
    } else {
      const imageList = fileList.filter((file) => {
        return !file.startsWith('.');
      });
      const fileIndex = parseInt(Math.random() * imageList.length, 10);
      session.send(
        `[CQ:image,file=http://0.0.0.0:${config.port}/public/pic-lib/night/${imageList[fileIndex]}]`);
    }
  });
}

module.exports = {
  name,
  alias,
  desc,
  handler,
};
