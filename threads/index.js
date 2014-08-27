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
  return threadsDb.find(id); // already simple
};

threads.update = function(data) {
  var thread = new Thread(data);

  return thread.validate()
  .then(function() {
    return threadsDb.update(thread);
  })
  .then(function(thread) {
    return thread.simple();
  });
};

threads.delete = function(id) {
  return threadsDb.delete(id)
  .then(function(thread) {
    return thread.simple();
  });
};

threads.purge = function(id) {
  return threadsDb.purge(id)
  .then(function(thread) {
    return thread.simple();
  });
};

threads.threadByOldId = function(oldId) {
  return threadsDb.threadByOldId(oldId); // already simple
};

threads.byBoard = function(boardId, opts) {
  return threadsDb.byBoard(boardId, opts); // all already simple
};
