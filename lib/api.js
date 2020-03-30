const { cqhttpapiHost, cqhttpapiPort, cqhttpapiAccessToken } = require(
  '../config');
const bent = require('bent');

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

  async get_group_member_info(group_id, user_id, no_cache = false) {
    const post = bent(`http://${cqhttpapiHost}:${cqhttpapiPort}/`, 'POST',
      'json',
      200);
    const headers = {};
    if (cqhttpapiAccessToken.length !== 0) {
      headers.Authorization = `Bearer ${cqhttpapiAccessToken}`;
    }
    const data = {
      group_id: group_id,
      user_id: user_id,
    };
    const response = await post('get_group_member_info', data, headers);
    return response;
  }

  async send_group_msg_http(groupId, message, autoEscape = false) {
    const data = {
      group_id: groupId,
      message: message.toString().trim(),
      auto_escape: autoEscape,
    };
    const action = 'send_group_msg';
    const post = bent(`http://${cqhttpapiHost}:${cqhttpapiPort}/`, 'POST',
      'json',
      200);
    const headers = {};
    if (cqhttpapiAccessToken.length !== 0) {
      headers.Authorization = `Bearer ${cqhttpapiAccessToken}`;
    }
    await post(action, data, headers);
  }

  async send_private_msg_http(userId, message, autoEscape = false) {
    const data = {
      user_id: userId,
      message: message.toString().trim(),
      auto_escape: autoEscape,
    };
    const action = 'send_private_msg';
    const post = bent(`http://${cqhttpapiHost}:${cqhttpapiPort}/`, 'POST',
      'json',
      200);
    const headers = {};
    if (cqhttpapiAccessToken.length !== 0) {
      headers.Authorization = `Bearer ${cqhttpapiAccessToken}`;
    }
    await post(action, data, headers);
  }
}

module.exports = new API();
