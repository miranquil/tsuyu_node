const { BlackHandler } = require('../lib/type/handler');

const handler = new BlackHandler('咕咕咕', (session) => {
  session.send('汝是何人？');
});

module.exports = [handler];
