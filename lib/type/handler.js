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

  async handle() {
    if (this.type === protoType) {
      throw Error('Function "handler" must be implemented.');
    }
  }
}

class BlackHandler extends Handler {
  constructor(name, callback) {
    super(name);
    this.type = blackType;
    this.callback = callback;
  }

  async handle(...args) {
    await this.callback(...args);
  }
}

class CommandHandler extends Handler {
  constructor(name, alias, desc, callback) {
    super(name);
    this.type = commandType;
    this.name = name;
    this.needAdmin = false;
    if (!Array.isArray(alias)) {
      this.alias = [alias];
    } else {
      this.alias = alias;
    }
    this.desc = desc;
    this.callback = callback;
  }

  async handle(...args) {
    await this.callback(...args);
  }
}

class WebhookHandler extends Handler {
  constructor(name, callback) {
    super(name);
    this.type = webhookType;
    this.name = name;
    this.callback = callback;
  }

  async handle(...args) {
    await this.callback(...args);
  }
}

class RequestHandler extends Handler {
  constructor(name, callback) {
    super(name);
    this.type = requestType;
    this.name = name;
    this.callback = callback;
  }

  async handle(...args) {
    await this.callback(...args);
  }
}

class NoticeHandler extends Handler {
  constructor(name, callback) {
    super(name);
    this.type = noticeType;
    this.name = name;
    this.callback = callback;
  }

  async handle(...args) {
    await this.callback(...args);
  }
}

class OtherHandler extends Handler {
  constructor(name, callback) {
    super(name);
    this.type = otherType;
    this.name = name;
    this.callback = callback;
  }

  async handle(...args) {
    await this.callback(...args);
  }
}

module.exports = {
  BlackHandler,
  CommandHandler,
  RequestHandler,
  NoticeHandler,
  WebhookHandler,
  OtherHandler,
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
