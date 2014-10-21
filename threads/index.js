var threads = {};
module.exports = threads;

var path = require('path');
var threadsDb = require(path.join(__dirname, 'db'));
var validate = require(path.join(__dirname, 'validate'));

threads.import = function(json) {
  return validate.import(json)
  .then(threadsDb.import);
};

threads.create = function(json) {
  return validate.create(json)
  .then(threadsDb.create);
};

threads.find = function(id) {
  return validate.id(id)
  .then(threadsDb.find);
};

threads.delete = function(id) {
  return validate.id(id)
  .then(threadsDb.delete);
};

threads.undelete = function(id) {
  return validate.id(id)
  .then(threadsDb.undelete);
};

threads.purge = function(id) {
  return validate.id(id)
  .then(threadsDb.purge);
};

threads.incViewCount = function(id) {
  return validate.id(id)
  .then(threadsDb.incViewCount);
};

threads.threadByOldId = function(oldId) {
  return validate.numId(oldId)
  .then(threadsDb.threadByOldId);
};

threads.byBoard = function(boardId, opts) {
  return threadsDb.byBoard(boardId, opts);
};
