const express = require('express');
const config = require('../config');
const { logger } = require('./logger');
const handle = require('./handle');
const { Session } = require('../lib/type/session');

const app = express();
require('express-ws')(app);

let _ws;

app.use(express.json());
app.use('/public', express.static('public'));

app.ws('/ws', (ws, req) => {
  logger.debug('WebSocket connection established.');
  _ws = ws;
  ws.on('message', (message) => {
    _process(message, ws);
  });
});

app.post('/payload', (req, res) => {
  const data = _processPayload(req);
  res.sendStatus(200);
  logger.info(`P-Request ${req.headers['content-type']} handled.`);
});

function _process(msgText, ws) {
  let _message = null;
  try {
    _message = JSON.parse(msgText);
  } catch (e) {
    logger.warn(`Parsing ${msgText}:${e}`);
    return undefined;
  }
  if (!_message.status) {
    try {
      handle.handleMessage(new Session(_message, ws));
    } catch (e) {
      logger.error(e.toString());
    }
  }
}

function _processPayload(request) {
  handle.handlePayload(request, _ws);
}

function run() {
  app.listen(config.port, config.host, () => {
    console.info(` _____   _____   _   _  __    __  _   _  
|_   _| /  ___/ | | | | \\ \\  / / | | | | 
  | |   | |___  | | | |  \\ \\/ /  | | | | 
  | |   \\___  \\ | | | |   \\  /   | | | | 
  | |    ___| | | |_| |   / /    | |_| | 
  |_|   /_____/ \\_____/  /_/     \\_____/ `);
    logger.info(`Listening: http://${config.host}:${config.port}`);
  });
}

module.exports.run = run;
