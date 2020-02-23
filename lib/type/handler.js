const { Session } = require('./session');

const commandType = 'command';
const requestType = 'request';
const noticeType = 'notice';
const webhookType = 'webhook';
const otherType = 'other';
const blackType = 'blacklist';
const protoType = 'proto';

class Handler {
  constructor(name) {
    this.name = name;
    this.type = protoType;
  }

  handle() {
    if (this.type === protoType) {
      throw Error('Function "handler" must be implemented.');
    }
  }
}

class BlackHandler extends Handler {
  constructor(name, callback) {
    super(name);
    this.type = blackType;
    this.handle = callback;
  }
}

class CommandHandler extends Handler {
  constructor(name, alias, desc, callback) {
    super(name);
    this.type = commandType;
    this.name = name;
    this.alias = alias;
    this.desc = desc;
    this.callback = callback;
  }

  handle(...args) {
    this.callback(...args);
  }
}

class WebhookHandler extends Handler {
  constructor(name, callback) {
    super(name);
    this.type = 'webhook';
    this.name = name;
    this.handle = callback;
  }
}

module.exports = {
  BlackHandler,
  CommandHandler,
  WebhookHandler,
};
module.exports.types = {
  commandType,
  requestType,
  noticeType,
  webhookType,
  blackType,
  otherType,
};
module.exports.typeList = [
  commandType,
  requestType,
  noticeType,
  webhookType,
  blackType,
  otherType,
];