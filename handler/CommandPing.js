const { CommandHandler } = require('../lib/type/handler');

const ping = new CommandHandler('ping', [], '通信延迟', async (session) => {
  const timeStamp = Date.now();
  let latency = timeStamp / 1000 - session.msgJson.time;
  latency = latency.toString();
  latency = latency.slice(0, latency.indexOf('.') + 3);
  session.send(`${latency}s`);
});

module.exports = [ping];
