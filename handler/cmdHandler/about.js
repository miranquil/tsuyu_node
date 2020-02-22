const name = 'about';
const alias = [];
const desc = '关于露儿';

function handler(session) {
  session.send('Tsuyu 3.0: Hello world!');
}

module.exports = {
  name,
  alias,
  desc,
  handler,
};
