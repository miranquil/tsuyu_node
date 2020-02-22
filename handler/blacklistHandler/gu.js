const name = '咕咕咕';

function handler(session) {
  // 嘲讽一下被拉黑的人？
  session.send('本宫不识得汝');
}

module.exports = { name, handler };
