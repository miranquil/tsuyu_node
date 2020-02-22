function send_private_msg(ws, userId, message, autoEscape = false) {
  const params = {
    user_id: userId,
    message: message.toString().trim(),
    auto_escape: autoEscape,
  };
  const action = 'send_private_msg';
  const data = {
    action,
    params,
  };
  ws.send(JSON.stringify(data));
}

function send_group_msg(ws, groupId, message, autoEscape = false) {
  const params = {
    group_id: groupId,
    message: message.toString().trim(),
    auto_escape: autoEscape,
  };
  const action = 'send_group_msg';
  const data = {
    action,
    params,
  };
  ws.send(JSON.stringify(data));
}

module.exports = { send_private_msg, send_group_msg };
