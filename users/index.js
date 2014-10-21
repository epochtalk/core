var users = {};
module.exports = users;

var path = require('path');
var usersDb = require(path.join(__dirname, 'db'));
var validate = require(path.join(__dirname, 'validate'));

users.import = function(json) {
  return validate.import(json)
  .then(usersDb.import);
};

users.create = function(json) {
  return validate.create(json)
  .then(usersDb.create);
};

users.find = function(id) {
  return validate.id(id)
  .then(usersDb.find);
};

users.userByOldId = function(oldId) {
  return validate.numId(oldId)
  .then(usersDb.userByOldId);
};

users.userByUsername = function(username) {
  return validate.username(username)
  .then(usersDb.userByUsername);
};

users.userByEmail = function(email) {
  return validate.email(email)
  .then(usersDb.userByEmail);
};

users.update = function(json) {
  return validate.update(json)
  .then(usersDb.update);
};

users.delete = function(id) {
  return validate.id(id)
  .then(usersDb.delete);
};

users.undelete = function(id) {
  return validate.id(id)
  .then(usersDb.undelete);
};

users.purge = function(id) {
  return validate.id(id)
  .then(usersDb.purge);
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
