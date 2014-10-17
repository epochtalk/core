var users = {};
module.exports = users;

var path = require('path');
var Promise = require('bluebird');
var usersDb = require(path.join(__dirname, 'db'));
var User = require(path.join(__dirname, 'model'));
var validate = require(path.join(__dirname, 'validate'));

users.import = function(data) {
  return validate.import(data)
  .then(function() {
    return usersDb.import(data);
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
  return usersDb.all();
};

users.getUserViews = function(userId) {
  return usersDb.getUserViews(userId);
};

users.putUserViews = function(userId, userViewsArray) {
  return usersDb.putUserViews(userId, userViewsArray);
};
