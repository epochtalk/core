var uuid = require('node-uuid');
var path = require('path');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var sep = confg.
var users = {};
var modelPrefix = 'user';

var Promise = require('bluebird');
db = Promise.promisifyAll(db);

users.create = function(user, cb) {
  user.created_at = Date.now();
  var id = uuid.v1({msecs: user.created_at});
  var key = modelPrefix + sep + id;
  user.id = id;
  db.putAsync(key, user)
  .then(function(version) {
    user.version = version;
    return user;
  });
};

users.find = function(id, cb) {
  db.get(modelPrefix + id, cb);
};

users.all = function(cb) {
  var entries = [];
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry); })
    .on('close', function () { cb(null, entries); });
};

module.exports = users;
