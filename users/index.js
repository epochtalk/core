var users = {};
module.exports = users;

var path = require('path');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var modelPrefix = config.users.prefix;
var sep = config.sep;
var usersDb = require(path.join(__dirname, 'db'));
var User = require(path.join(__dirname, 'model'));

users.import = function(data) {
  var newUser = new User(data);
  return newUser.validateImport()
  .then(function() {
    return usersDb.import(newUser);
  });
};

users.create = function(data) {
  var newUser = new User(data);
  return newUser.validateCreate()
  .then(function() {
    return usersDb.insert(newUser);
  });
};

users.find = function(id) {
  var key = modelPrefix + sep + id;
  return db.content.getAsync(key)
  .then(function(user) {
    delete user.passhash;
    delete user.id;
    return user;
  });
};

users.all = function(cb) {
  var entries = [];
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry); })
    .on('close', function () { cb(null, entries); });
};

