var users = {};
module.exports = users;

var uuid = require('node-uuid');
var path = require('path');
var bcrypt = require('bcrypt');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var modelPrefix = config.users.prefix;
var sep = config.sep;

var validator = require(path.join(__dirname, 'validator'));

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

  return db.content.putAsync(key, user)
  .then(function() {
    return user;
  });
};

users.create = function(user) {
  return validator.createUser(user, create);
}


var find = function(id) {
  var key = modelPrefix + sep + id;
  return db.content.getAsync(key)
  .then(function(user) {
    return user;
  });
};


var all = function(cb) {
  var entries = [];
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry); })
    .on('close', function () { cb(null, entries); });
};

