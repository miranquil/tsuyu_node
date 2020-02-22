const level = require('level');
const { logger } = require('./logger');

const db = level(`${process.cwd()}/data.db`, {
  valueEncoding: 'json',
});

function get(key, callback) {
  return new Promise((resolve, reject) => {
    db.get(key, (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          if (callback) {
            callback(data);
          }
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

function put(key, value, callback) {
  return new Promise((resolve, reject) => {
    db.put(key, value, (err) => {
      if (err) {
        reject(err);
      } else {
        try {
          if (callback) {
            callback();
          }
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

module.exports = {
  get,
  put,
};
