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
  var importUser = new User(data);
  return importUser.validateImport()
  .then(function() {
    return usersDb.import(importUser);
  })
  .then(function(user) {
    return user.simple();
  });
};

users.create = function(data) {
  var newUser = new User(data);
  return newUser.validateCreate()
  .then(function() {
    return usersDb.insert(newUser);
  })
  .then(function(user) {
    return user.simple();
  });
};

users.find = function(id) {
  return usersDb.find(id)
  .then(function(user) {
    delete user.passhash; // which one is it?
    delete user.password; // or this one?
    delete user.id;
    return user; // already simple
  });
};

users.userByOldId = function(oldId) {
  return usersDb.userByOldId(oldId)
  .then(function(user) {
    delete user.passhash; // which one is it?
    delete user.password; // or this one?
    delete user.id;
    return user;
  });
};

// update

// delete

users.all = function(cb) {
  var entries = [];
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry); })
    .on('close', function () { cb(null, entries); })
    .on('end', function () { cb(null, entries); });
};

