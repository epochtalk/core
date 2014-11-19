var posts = {};
module.exports = posts;
var path = require('path');
var postsDb = require(path.join(__dirname, 'db'));
var validate = require(path.join(__dirname, 'validate'));

posts.import = function(json) {
  return validate.import(json)
  .then(postsDb.import);
};

posts.create = function(json) {
  return validate.create(json)
  .then(postsDb.create);
};

posts.find = function(id) {
  return validate.id(id)
  .then(postsDb.find);
};

posts.update = function(json) {
  return validate.update(json)
  .then(postsDb.update);
};

posts.delete = function(id) {
  return validate.id(id)
  .then(postsDb.delete);
};

posts.undelete = function(id) {
  return validate.id(id)
  .then(postsDb.undelete);
};

posts.purge = function(id) {
  return validate.id(id)
  .then(postsDb.purge);
};

posts.postByOldId = function(oldId) {
  return validate.numId(oldId)
  .then(postsDb.postByOldId);
};

posts.byThread = function(threadId, opts) {
  return postsDb.byThread(threadId, opts);
};

posts.versions = function(id) {
  return validate.id(id)
  .then(postsDb.versions);
};
