var threads = {};
module.exports = threads;

var path = require('path');
var threadsDb = require(path.join(__dirname, 'db'));
var threadsValidator = require('epoch-validator').core.threads;

threads.import = function(json) {
  return threadsValidator.import(json)
  .then(threadsDb.import);
};

threads.create = function(json) {
  return threadsValidator.create(json)
  .then(threadsDb.create);
};

threads.find = function(id) {
  return threadsValidator.id(id)
  .then(threadsDb.find);
};

threads.delete = function(id) {
  return threadsValidator.id(id)
  .then(threadsDb.delete);
};

threads.undelete = function(id) {
  return threadsValidator.id(id)
  .then(threadsDb.undelete);
};

threads.purge = function(id) {
  return threadsValidator.id(id)
  .then(threadsDb.purge);
};

threads.incViewCount = function(id) {
  return threadsValidator.id(id)
  .then(threadsDb.incViewCount);
};

threads.threadByOldId = function(oldId) {
  return threadsValidator.numId(oldId)
  .then(threadsDb.threadByOldId);
};

threads.byBoard = function(boardId, opts) {
  return threadsDb.byBoard(boardId, opts);
};
