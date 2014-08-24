var threads = {};
module.exports = threads;
var path = require('path');
var threadsDb = require(path.join(__dirname, 'db'));
var Thread = require(path.join(__dirname, 'model'));

threads.import = function(data) {
  var newThread = new Thread(data);
  return newThread.validate()
  .then(function() {
    return threadsDb.import(newThread);
  })
  .then(function(thread) {
    return thread.simple();
  });
};

threads.create = function(data) {
  var newThread = new Thread(data);
  return newThread.validate()
  .then(function() {
    return threadsDb.insert(newThread);
  })
  .then(function(thread) {
    return thread.simple();
  });
};

threads.find = function(id) {
  return threadsDb.find(id)
  .then(function(thread) {
    return thread; // already simple
  });
};

threads.delete = function(id) {
  return threadsDb.remove(id)
  .then(function(thread) {
    return thread.simple();
  });
};

threads.threadByOldId = function(oldId) {
  return threadsDb.threadByOldId(oldId)
  .then(function(thread) {
    return thread;
  });
};

threads.byBoard = function(boardId, opts) {
  return threadsDb.byBoard(boardId, opts)
  .then(function(threads) {
    return threads; // all already simple
  });
};
