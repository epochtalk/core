var threadsDb = {};
module.exports = threadsDb;
var path = require('path');
var uuid = require('node-uuid');
var Promise = require('bluebird');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));

// thread must have a board_id
threadsDb.insert = function(thread) {
  if (!thread.board_id) {
    return Promise.reject('Invalid board id.');
  }
  var timestamp = Date.now();
  thread.created_at = timestamp;
  thread.updated_at = timestamp;
  thread.id = timestamp + uuid.v1({ msecs: timestamp });
  return db.content.putAsync(thread.getKey(), thread)
  .then(function() {
    var boardThreadKey = thread.getBoardThreadKey();
    var postCountKey = thread.getPostCountKey();
    if (boardThreadKey && postCountKey) {
      return db.indexes.putAsync(boardThreadKey, thread.id)
      .then(function() {
        return db.metadata.putAsync(postCountKey, 0)
        .then(function() {
          return thread;
        });
      });
    }
  });
};

threadsDb.remove = function(thread) {
  return db.content.delAsync(thread.getKey())
  .then(function() {
    db.deleted.putAsync(thread.getKey, thread);
  })
  .then(function() {
    return thread;
  });
};

threadsDb.find = function(id) {
  return db.content.getAsync(config.threads.prefix + config.sep + id)
  .then(function(thread) {
    return thread;
  });
};

threadsDb.update = function(thread) {
  var updatedThread;
  var threadKey = config.threads.prefix + config.sep + thread.id;
  return db.content.getAsync(threadKey)
  .then(function(threadFromDb) {
    threadFromDb.title = thread.title;
    updatedThread = threadFromDb;
    db.content.putAsync(threadKey, updatedThread)
    .then(function() {
      return updatedThread;
    });
  });
};

threadsDb.byBoard = function(boardId, opts) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    // return map of entries as an threadId and title
    var handler = function() {
      return fulfill(entries);
    };

    // query vars
    var startThreadKey = config.threads.indexPrefix + config.sep + boardId + config.sep;
    var endThreadKey = startThreadKey;
    var limit = opts.limit ? Number(opts.limit) : 10;
    startThreadKey += '\xff';
    endThreadKey += '\x00';
    var queryOptions = {
      limit: limit,
      reverse: true,
      start: startThreadKey,
      end: endThreadKey
    };

    // query thread Index
    db.indexes.createValueStream(queryOptions)
    .on('data', function(value) {
      threadsDb.find(value).
      then(function(thread) {
        entries.push(thread);
      });
    })
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};