var threadsDb = {};
module.exports = threadsDb;

var path = require('path');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Thread = require(path.join(__dirname, 'model'));
var helper = require(path.join(__dirname, '..', 'helper'));

threadsDb.import = function(thread) {
  thread.imported_at = Date.now();
  return threadsDb.insert(thread)
  .then(function(dbThread) {
    if (dbThread.smf) {
      return db.legacy.putAsync(thread.getLegacyKey(), dbThread.id)
      .then(function() { return dbThread; });
    }
  });
};

// thread must have a board_id
threadsDb.insert = function(thread) {
  if (!thread.board_id) {
    return Promise.reject('Invalid board id.');
  }
  var timestamp = Date.now();
  thread.created_at = timestamp;
  thread.updated_at = timestamp;
  thread.id = helper.genId();
  var boardThreadKey = thread.getBoardThreadKey();
  var postCountKey = thread.getPostCountKey();
  return db.content.putAsync(thread.getKey(), thread)
  .then(function() { return db.indexes.putAsync(boardThreadKey, thread.id); })
  .then(function() { return db.metadata.putAsync(postCountKey, 0); })
  .then(function() { return thread; });
};

threadsDb.remove = function(id) {
  var threadKey = Thread.getKeyFromId(id);
  var deletedThread;
  var boardThreadKey;
  var postCountKey;

  return db.content.getAsync(threadKey)
  .then(function(thread) {
    deletedThread = new Thread(thread);
    boardThreadKey = deletedThread.getBoardThreadKey();
    postCountKey = deletedThread.getPostCountKey();
  })
  .then(function() {
    return db.deleted.putAsync(threadKey, deletedThread);
  })
  .then(function() {
    return db.content.delAsync(threadKey);
  })
  .then(function() {
    return db.indexes.delAsync(boardThreadKey)
    .then(function() {
      return db.metadata.delAsync(postCountKey);
    });
  })
  .then(function() { return deletedThread; });
};

threadsDb.find = function(id) {
  var thread;
  var threadKey = config.threads.prefix + config.sep + id;

  return db.content.getAsync(threadKey)
  .then(function(dbThread) {
    thread = dbThread;
    return db.metadata.getAsync(threadKey + config.sep + 'post_count');
  })
  .then(function(count) {
    thread.post_count = Number(count);
    return db.metadata.getAsync(threadKey + config.sep + 'title');
  })
  .then(function(title) {
    thread.title = title;
    return thread;
  });
};

threadsDb.threadByOldId = function(oldId) {
  var legacyThreadKey = Thread.getLegacyKeyFromId(oldId);

  return db.legacy.getAsync(legacyThreadKey)
  .then(function(threadId) {
    return threadsDb.find(threadId);
  });
};

threadsDb.byBoard = function(boardId, opts) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    // return map of entries as an threadId and title
    var handler = function() {
      var fullEntries = Promise.all(entries.map(function(entry) {
        return threadsDb.find(entry);
      }));
      return fulfill(fullEntries);
    };
    var sorter = function(value) { entries.push(value); };

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
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};