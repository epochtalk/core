var users = {};
module.exports = users;

var path = require('path');
var Promise = require('bluebird');
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
  return usersDb.find(id); // already simple
};

users.userByOldId = function(oldId) {
  return usersDb.findByLegacyId(oldId); // already simple
};

users.userByUsername = function(username) {
  return usersDb.findByUsername(username); // already simple
};

users.userByEmail = function(email) {
  return usersDb.findByEmail(email); // already simple
};

users.update = function(data) {
  var updateUser = new User(data);

  return updateUser.validateUpdate()
  .then(function(data) {
    return usersDb.update(updateUser);
  })
  .then(function(user) {
    return user.simple();
  });
};

users.delete = function(id) {
  return usersDb.delete(id)
  .then(function(user) {
    return user.simple();
  });
};

users.purge = function(id) {
  return usersDb.purge(id)
  .then(function(user) {
    return user.simple();
  });
};

users.all = function() {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    var sorter = function(entry) {
      entries.push(entry.value);
    };
    var handler = function() {
      return fulfill(entries);
    };
    
    var query = { start: modelPrefix, end: modelPrefix + '\xff'};
    db.content.createReadStream(query)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

users.getUserViews = function(userId) {
  return usersDb.getUserViews(userId);
};

users.putUserViews = function(userId, userViewsArray) {
  return usersDb.putUserViews(userId, userViewsArray);
};
