var threads = {};
module.exports = threads;
var path = require('path');
var threadsDb = require(path.join(__dirname, 'db'));
var Thread = require(path.join(__dirname, 'model'));

threads.create = function(data) {
  var newThread = new Thread(data);
  return threadsDb.insert(newThread)
  .then(function(thread) {
    return thread;
  });
};

threads.find = function(id) {
  return threadsDb.find(id)
  .then(function(thread) {
    return thread;
  });
};

threads.delete = function(data) {
  var threadToDelete = new Thread(data);
  return threadsDb.remove(threadToDelete)
  .then(function(thread) {
    return thread;
  });
};

threads.byBoard = function(boardId, opts) {
  return threadsDb.byBoard(boardId, opts)
  .then(function(threads) {
    return threads;
  });
};
