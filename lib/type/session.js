const api = require('../api');

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

module.exports = { Session };
