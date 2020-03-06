const bent = require('bent');
const { CommandHandler } = require('../lib/type/handler');

const nn = new CommandHandler('nuannuan', ['nn', '暖暖'], '本周金蝶暖暖答案',
  async (session) => {
    const get = bent('http://nuannuan.yorushika.co:5000', 'GET', 'json', 200);
    const response = await get();
    session.send(response['content']);
  });

module.exports = [nn];
