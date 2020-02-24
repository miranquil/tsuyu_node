class API {
  send_private_msg(ws, userId, message, autoEscape = false) {
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

  send_group_msg(ws, groupId, message, autoEscape = false) {
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

  send_discuss_msg(ws, discussId, message, autoEscape = false) {
    const params = {
      discuss_id: discussId,
      message: message.toString().trim(),
      auto_escape: autoEscape,
    };
    const action = 'send_discuss_msg';
    const data = {
      action,
      params,
    };
    ws.send(JSON.stringify(data));
  }

  set_group_ban(ws, groupId, userId, duration) {
    const params = {
      group_id: groupId,
      user_id: userId,
      duration: duration,
    };
    const action = 'set_group_ban';
    const data = {
      action,
      params,
    };
    ws.send(JSON.stringify(data));
  }

  set_friend_add_request(ws, flag, approve, remark = '') {
    const params = {
      flag,
      approve,
      remark,
    };
    const action = 'set_friend_add_request';
    const data = {
      action,
      params,
    };
    ws.send(JSON.stringify(data));
  }

  set_group_add_request(ws, flag, type, approve, reason = '') {
    const params = {
      flag,
      type,
      approve,
      reason,
    };
    const action = 'set_group_add_request';
    const data = {
      action,
      params,
    };
    ws.send(JSON.stringify(data));
  }
}

module.exports = new API();
