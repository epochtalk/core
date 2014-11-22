var users = {};
module.exports = users;

var path = require('path');
var usersDb = require(path.join(__dirname, 'db'));
var usersValidator = require('epoch-validator').core.users;

users.import = function(json) {
  return usersValidator.import(json)
  .then(usersDb.import);
};

users.create = function(json) {
  return usersValidator.create(json)
  .then(usersDb.create);
};

users.find = function(id) {
  return usersValidator.id(id)
  .then(usersDb.find);
};

users.userByOldId = function(oldId) {
  return usersValidator.numId(oldId)
  .then(usersDb.userByOldId);
};

users.userByUsername = function(username) {
  return usersValidator.username(username)
  .then(usersDb.userByUsername);
};

users.userByEmail = function(email) {
  return usersValidator.email(email)
  .then(usersDb.userByEmail);
};

users.update = function(json) {
  return usersValidator.update(json)
  .then(usersDb.update);
};

users.delete = function(id) {
  return usersValidator.id(id)
  .then(usersDb.delete);
};

users.undelete = function(id) {
  return usersValidator.id(id)
  .then(usersDb.undelete);
};

users.purge = function(id) {
  return usersValidator.id(id)
  .then(usersDb.purge);
};

users.all = function() {
  return usersDb.all();
};

users.getUserViews = function(id) {
  return usersValidator.id(id)
  .then(usersDb.getUserViews);
};

users.putUserViews = function(userId, userViewsArray) {
  return usersDb.putUserViews(userId, userViewsArray);
};
