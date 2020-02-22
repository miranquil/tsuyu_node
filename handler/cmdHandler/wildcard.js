const name = '*';
const alias = [];
const desc = '摸鱼';

function handler(session) {
  session.send('露娘摸完第二阶段了！那么到底要不要继续摸鱼！');
  session.send('咕咕！咕咕咕！');
}

module.exports = { name, alias, desc, handler };
