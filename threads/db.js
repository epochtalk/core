var threadsDb = {};
module.exports = threadsDb;

var path = require('path');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Thread = require(path.join(__dirname, 'model'));
var helper = require(path.join(__dirname, '..', 'helper'));
var boardsDb = require(path.join(__dirname, '..', 'boards', 'db'));
var Padlock = require('padlock').Padlock;
var lock = new Padlock();

threadsDb.import = function(thread) {
  thread.imported_at = Date.now();
  return threadsDb.insert(thread)
  .then(function(dbThread) {
    if (dbThread.smf) {
      return db.legacy.putAsync(thread.legacyKey(), dbThread.id)
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
  // If created at doesnt exist
  if (!thread.created_at) {
    thread.created_at = timestamp;
  }
  thread.id = helper.genId(thread.created_at);
  var boardThreadKey = thread.boardThreadKey(thread.created_at);
  var threadKey = thread.key();
  var lastPostUsernameKey = Thread.lastPostUsernameKeyFromId(thread.id);
  var lastPostCreatedAtKey = Thread.lastPostCreatedAtKeyFromId(thread.id);
  var viewCountKey = Thread.viewCountKeyFromId(thread.id);
  var metadataBatch = [
    // TODO: There should be a better solution than initializing with strings
    { type: 'put', key: lastPostUsernameKey, value: 'none' },
    { type: 'put', key: lastPostCreatedAtKey, value: thread.created_at },
    { type: 'put', key: viewCountKey , value: 0 }
  ];
  return db.metadata.batchAsync(metadataBatch)
  .then(function() { return db.content.putAsync(threadKey, thread); })
  .then(function() { return db.indexes.putAsync(boardThreadKey, thread.id); })
  .then(function() { return threadsDb.incPostCount(thread.id); })
  .then(function() { return boardsDb.incThreadCount(thread.board_id); })
  .then(function() { return thread; });
};

threadsDb.incPostCount = function(id) {
  var postCountKey = Thread.postCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    lock.runwithlock(function () {
      var newPostCount = 0;
      db.metadata.getAsync(postCountKey)
      .then(function(postCount) {
        newPostCount = Number(postCount);
        newPostCount++;
        return newPostCount;
      })
      .catch(function() { return newPostCount; })
      .then(function(postCount) { return db.metadata.putAsync(postCountKey, postCount); })
      .then(function() { fulfill(newPostCount); })
      .catch(function(err) { reject(err); })
      .finally(function() { lock.release(); });
    });
  });
};

threadsDb.decPostCount = function(id) {
  var postCountKey = Thread.postCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    lock.runwithlock(function () {
      var newPostCount = 0;
      db.metadata.getAsync(postCountKey)
      .then(function(postCount) {
        newPostCount = Number(postCount);
        if (newPostCount > 0) {
          newPostCount--;
        }
        return newPostCount;
      })
      .catch(function() { return newPostCount; })
      .then(function(postCount) { return db.metadata.putAsync(postCountKey, postCount); })
      .then(function() { fulfill(newPostCount); })
      .catch(function(err) { reject(err); })
      .finally(function() { lock.release(); });
    });
  });
};

threadsDb.update = function(thread) {
  var threadKey = thread.key();
  var updateThread;

  return db.content.getAsync(threadKey) // get old post
  .then(function(oldThread) {
    updateThread = new Thread(oldThread);

    // update thread values
    updateThread.deleted = thread.deleted;
    updateThread.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(threadKey, updateThread);
  })
  .then(function() { return updateThread; });
};

threadsDb.delete = function(id) {
  var threadKey = Thread.keyFromId(id);
  var deletedThread = null;

  // see if thread already exists
  return db.content.getAsync(threadKey)
  .then(function(threadData) {
    deletedThread = new Thread(threadData);

    // add deleted: true flag to board
    deletedThread.deleted = true;
    deletedThread.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(threadKey, deletedThread);
  })
  .then(function() { return deletedThread; });
};

threadsDb.purge = function(id) {
  var deletedThread;
  var threadKey = Thread.keyFromId(id);
  var postCountKey = Thread.postCountKeyFromId(id);
  var lastPostUsernameKey = Thread.lastPostUsernameKeyFromId(id);
  var lastPostCreatedAtKey = Thread.lastPostCreatedAtKeyFromId(id);
  var viewCountKey = Thread.viewCountKeyFromId(id);
  var firstPostIdKey = Thread.firstPostIdKeyFromId(id);
  var postTitleKey = Thread.titleKeyFromId(id);
  var usernameKey = Thread.usernameKeyFromId(id);
  return db.content.getAsync(threadKey) // get thread
  .then(function(thread) {
    deletedThread = new Thread(thread);
  })
  .then(function() { // move to deleted DB
    return db.deleted.putAsync(threadKey, deletedThread);
  })
  .then(function() { // remove from content
    return db.content.delAsync(threadKey);
  })
  .then(function() { // remove board - thread index
    return db.metadata.getAsync(lastPostCreatedAtKey)
    .then(function(timestamp) {
      var boardThreadKey = deletedThread.boardThreadKey(timestamp);
      return db.indexes.delAsync(boardThreadKey);
    });
  })
  .then(function() { // remove post count Key
    return db.metadata.delAsync(postCountKey);
  })
  .then(function() { // remove last post username Key
    return db.metadata.delAsync(lastPostUsernameKey);
  })
  .then(function() { // remove last post created at Key
    return db.metadata.delAsync(lastPostCreatedAtKey);
  })
  .then(function() { // remove first Post Id Key
    return db.metadata.delAsync(firstPostIdKey);
  })
  .then(function() { // remove post title Key
    return db.metadata.delAsync(postTitleKey);
  })
  .then(function() { // remove username Key
    return db.metadata.delAsync(usernameKey);
  })
  // TODO: This cannot be derived if we deleted it.
  // .then(function() { // remove view count Key
  //   return db.metadata.delAsync(viewCountKey);
  // })
  .then(function() { // decrement board thread count
    var boardId = deletedThread.board_id;
    return boardsDb.decThreadCount(boardId);
  })
  .then(function() {
    if (deletedThread.smf) {
      var legacyKey = deletedThread.legacyKey();
      return db.legacy.delAsync(legacyKey);
    }
    else { return; }
  })
  .then(function() { return deletedThread; });
};

threadsDb.find = function(id) {
  var thread;
  var threadKey = Thread.keyFromId(id);
  var postCountKey = Thread.postCountKeyFromId(id);
  var firstPostIdKey = Thread.firstPostIdKeyFromId(id);
  var titleKey = Thread.titleKeyFromId(id);
  var usernameKey = Thread.usernameKeyFromId(id);
  var lastPostUsernameKey = Thread.lastPostUsernameKeyFromId(id);
  var lastPostCreatedAtKey = Thread.lastPostCreatedAtKeyFromId(id);
  var viewCountKey = Thread.viewCountKeyFromId(id);
  return db.content.getAsync(threadKey)
  .then(function(dbThread) {
    thread = dbThread;
    return db.metadata.getAsync(postCountKey);
  })
  .then(function(count) {
    thread.post_count = Number(count);
    return db.metadata.getAsync(firstPostIdKey);
    // possibly add catch here if first post doesn't exist
  })
  .then(function(firstPostId) {
    thread.first_post_id = firstPostId;
    return db.metadata.getAsync(titleKey);
    // possibly add catch here if first post doesn't exist
  })
  .then(function(title) {
    thread.title = title;
    return db.metadata.getAsync(usernameKey);
    // possibly add catch here if usernameKey doesn't exit
  })
  .then(function(threadUsername) {
    thread.user = {
      username: threadUsername
    };
    return db.metadata.getAsync(lastPostUsernameKey)
  })
  .then(function(lastPostUsername) {
    thread.last_post_username = lastPostUsername;
    return db.metadata.getAsync(lastPostCreatedAtKey);
  })
  .then(function(lastPostCreatedAt) {
    thread.last_post_created_at = lastPostCreatedAt;
    return db.metadata.getAsync(viewCountKey);
  })
  .then(function(viewCount) {
    thread.view_count = Number(viewCount);
    return thread;
  });
};

threadsDb.threadByOldId = function(oldId) {
  var legacyThreadKey = Thread.legacyKeyFromId(oldId);

  return db.legacy.getAsync(legacyThreadKey)
  .then(function(threadId) {
    return threadsDb.find(threadId);
  });
};

threadsDb.byBoard = function(boardId, opts) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    var counted = 0;
    var sorter = function(value) {
      if (counted >= pushStart) {
        entries.push(value);
      }
      else { counted++; }
    };
    var handler = function() {
      Promise.map(entries, function(entry) {
        return threadsDb.find(entry);
      })
      .then(function(allThreads) {
        return fulfill(allThreads);
      });
    };

    // query vars
    var limit = opts.limit ? Number(opts.limit) : 10;
    var page = opts.page ? Math.abs(Number(opts.page)) : 1;

    // query keys
    var threadOrderPrefix = config.threads.indexPrefix;
    var sep = config.sep;
    var startKey = threadOrderPrefix + sep + boardId + sep;
    var endKey = startKey;
    startKey += '\xff';
    endKey += '\x00';

    // query counting
    var pushStart = limit * page - limit;
    var stopLimit = limit * page;

    var queryOptions = {
      limit: stopLimit,
      reverse: true,
      start: startKey,
      end: endKey
    };
    // query thread Index
    db.indexes.createValueStream(queryOptions)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};