const name = 'help';
const alias = [];
const desc = '使用手册';

function preHandler(preHandlerData) {
  return (session) => {
    let message = '';
    for (item of preHandlerData) {
      message += `.${item.name} ${item.desc}\n`;
    }
    message = message.trim();
    session.send(message);
  };
}

module.exports = { name, alias, desc, preHandler };
