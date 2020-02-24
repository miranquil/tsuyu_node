const { CommandHandler } = require('../lib/type/handler');

const handler = new CommandHandler('about', [], '关于露儿',
  async (session) => {
    session.send(`这里是露儿3.0，由露娘脱离现有SDK框架重新使用Node.js开发。
3.0版本将力图提供更轻量化的架构和更快的响应速度，意图进一步提升客制化可能。

GitHub: https://github.com/yorushika/tsuyu_node
Status: Developing

History:

[ ] Tsuyu 1.0: Moutain of shi*t
[ ] Tsuyu 2.0: A Reborn of Her Majesty
[*] Tsuyu 3.0: Heartsangel
`);
  });
module.exports = [handler];
