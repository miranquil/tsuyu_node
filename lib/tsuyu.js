const express = require('express');
const config = require('../config');
const { logger } = require('./logger');
const handle = require('./handle');
const api = require('./api');
const fs = require('fs');

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

class Session {
  constructor(msgJson, websocket) {
    this.msgJson = msgJson;
    this.message = msgJson.message;
    this._ws = websocket;
    this.user_id = msgJson.user_id;
    this.group_id = msgJson.group_id;
    this.self_id = msgJson.self_id;
    this.message_type = msgJson.message_type;
    if (!this.message_type) {
      throw Error(`Unrecognized message: ${JSON.stringify(msgJson)}`);
    }
    this.post_type = msgJson.post_type;
    if (this.message) {
      let tmpMessage = this.message;
      while (tmpMessage.indexOf('  ') !== -1) {
        tmpMessage = tmpMessage.replace('  ', ' ');
      }
      this.params = tmpMessage.split(' ').slice(1);
    }
  }

  send(message, autoEscape = false) {
    if (this.message_type === 'private') {
      api.send_private_msg(this._ws, this.user_id, message, autoEscape);
    } else if (this.message_type === 'group') {
      api.send_group_msg(this._ws, this.group_id, message, autoEscape);
    } else if (this.message_type === 'discuss') {
      api.send_discuss_msg(this._ws, this.msgJson.discuss_id, message,
        autoEscape);
    }
  }
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
module.exports.Session = Session;
