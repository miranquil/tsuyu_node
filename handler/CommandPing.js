const { CommandHandler } = require('../lib/type/handler');

const ping = new CommandHandler('ping', [], '通信延迟', (session) => {
  const timeStamp = Date.now();
  let latency = timeStamp - session.msgJson.time * 1000;
  latency = parseInt(latency, 10);
  session.send(`${latency}ms`);
});

module.exports = [ping];
