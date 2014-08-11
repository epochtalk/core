var users = {};
module.exports = users;

var uuid = require('node-uuid');
var path = require('path');
var bcrypt = require('bcrypt');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var sep = config.users.prefix;
var modelPrefix = 'user';

var validator = require(path.join(__dirname, 'validator'));

var Promise = require('bluebird');
db = Promise.promisifyAll(db);

var create = function(user) {
  user.created_at = Date.now();
  var id = uuid.v1({msecs: user.created_at});
  var key = modelPrefix + sep + id;
  user.id = id;
  var valid = false;
  user.passhash = bcrypt.hashSync(user.password, 12);
  user.timestamps = { created: new Date().getTime() };
  // original clear text is never stored
  delete user.password;
  delete user.confirm_password;

  return db.putAsync(key, user)
  .then(function(version) {
    user.version = version;
    return user;
  });
};

users.create = function(user) {
  return validator.createUser(user, create);
}


var find = function(id) {
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


var all = function(cb) {
  var entries = [];
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry); })
    .on('close', function () { cb(null, entries); });
};

