var uuid = require('node-uuid');
var path = require('path');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var sep = config.users.prefix;
var users = {};
var modelPrefix = 'user';
var Promise = require('bluebird');
db = Promise.promisifyAll(db);

users.create = function(user) {
  user.created_at = Date.now();
  var id = uuid.v1({msecs: user.created_at});
  var key = modelPrefix + sep + id;
  user.id = id;
  return db.putAsync(key, user)
  .then(function(version) {
    user.version = version;
    return user;
  });
};

users.find = function(id) {
  var key = modelPrefix + sep + id;
  return db.getAsync(key)
  .then(function(value) {
    var user = value[0];
    if (user.deleted) {
      throw new Error('Key has been deleted: ' + key);
    }
    return value[0];
  });
};

users.all = function(cb) {
  var entries = [];
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry); })
    .on('close', function () { cb(null, entries); });
};

module.exports = users;
