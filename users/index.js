var users = {};
module.exports = users;

var uuid = require('node-uuid');
var path = require('path');
var bcrypt = require('bcrypt');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var modelPrefix = config.users.prefix;
var sep = config.sep;
var usersDb = require(path.join(__dirname, 'db'));
var User = require(path.join(__dirname, 'model'));

var validator = require(path.join(__dirname, 'validator'));

var create = function(data) {
  var newUser = new User(data);
  return usersDb.insert(newUser);
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

