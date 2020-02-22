const express = require('express');
const config = require('../config');
const { logger } = require('./logger');
const handle = require('./handle');

const app = express();
require('express-ws')(app);

let _ws;

app.use(express.json());

app.ws('/ws', async (ws, req) => {
  logger.debug('WebSocket connection established.');
  _ws = ws;
  ws.on('message', (message) => {
    _process(message, ws);
  });
});

app.post('/payload', async (req, res) => {
  const data = _processPayload(req);
  res.sendStatus(200);
  logger.info(`P-Request ${req.headers['content-type']} handled.`);
});

async function _process(msgText, ws) {
  let _message = null;
  try {
    _message = JSON.parse(msgText);
  } catch (e) {
    logger.warn(`Parsing ${msgText}:${e}`);
    return undefined;
  }
  if (!_message.status) {
    handle.handleMessage(new Session(_message, ws));
  }
}

async function _processPayload(request) {
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
    this.post_type = msgJson.post_type;
    if (this.message) {
      const tmpMessage = this.message;
      while (tmpMessage.indexOf('  ') !== -1) {
        tmpMessage.replace('  ', ' ');
      }
      this.params = tmpMessage.split(' ').slice(1);
    }
  }

  send(message, autoEscape = false) {
    let action = '';
    let params = {};
    if (!this.group_id) {
      action = 'send_private_msg';
      params = {
        user_id: this.user_id,
      };
    } else if (this.user_id) {
      action = 'send_group_msg';
      params = {
        group_id: this.group_id,
      };
    } else {
      logger.warn(`Invalid session to send message: ${message}`);
    }
    params.message = message;
    params.auto_escape = autoEscape;
    const data = {
      action,
      params,
    };
    this._ws.send(JSON.stringify(data), (error) => {
      if (error) {
        logger.error(`WSError sending message: ${error}`);
      } else {
        logger.info(`Message "${message}" sent.`);
      }
    });
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
