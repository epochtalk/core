var threadsDb = {};
module.exports = threadsDb;

var path = require('path');
var Promise = require('bluebird');
var dbHelper = require(path.join(__dirname, '..', 'db', 'helper'));
var encodeIntHex = dbHelper.encodeIntHex;
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Thread = require(path.join(__dirname, 'model'));
var helper = require(path.join(__dirname, '..', 'helper'));
var boardsDb = require(path.join(__dirname, '..', 'boards', 'db'));
var Padlock = require('padlock').Padlock;
var postCountLock = new Padlock();
var viewCountLock = new Padlock();
var threadOrderLock = new Padlock();

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
  // var boardThreadKey = thread.boardThreadKey(thread.created_at);
  var threadKey = thread.key();
  var lastPostUsernameKey = Thread.lastPostUsernameKeyFromId(thread.id);
  var lastPostCreatedAtKey = Thread.lastPostCreatedAtKeyFromId(thread.id);
  var threadOrderKey = Thread.threadOrderKey(thread.id);
  var metadataBatch = [
    // TODO: There should be a better solution than initializing with strings
    { type: 'put', key: lastPostUsernameKey, value: 'none' },
    { type: 'put', key: lastPostCreatedAtKey, value: thread.created_at },
    { type: 'put', key: threadOrderKey, value: 0 }
  ];
  if (!thread.view_count) { thread.view_count = 0; }
  var viewCountKey = Thread.viewCountKeyFromId(thread.id);
  metadataBatch.push({ type: 'put', key: viewCountKey , value: thread.view_count });
  return db.metadata.batchAsync(metadataBatch)
  .then(function() { return db.content.putAsync(threadKey, thread); })
  // .then(function() { return db.indexes.putAsync(boardThreadKey, thread.id); })
  .then(function() { return threadsDb.incPostCount(thread.id); })
  .then(function() { return boardsDb.incThreadCount(thread.board_id); })
  .then(function() { return thread; });
};

threadsDb.incViewCount = function(id) {
  var viewCountKey = Thread.viewCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    viewCountLock.runwithlock(function() {
      var newViewCount = 0;
      db.metadata.getAsync(viewCountKey)
      .then(function(viewCount) {
        newViewCount = Number(viewCount);
        newViewCount++;
        return newViewCount;
      })
      .catch(function() { return newViewCount; })
      .then(function(viewCount) { return db.metadata.putAsync(viewCountKey, viewCount); })
      .then(function() { fulfill(newViewCount); })
      .catch(function(err) { reject(err); })
      .finally(function() { viewCountLock.release(); });
    });
  });
};

threadsDb.incPostCount = function(id) {
  var postCountKey = Thread.postCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function() {
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
      .finally(function() { postCountLock.release(); });
    });
  });
};

threadsDb.decPostCount = function(id) {
  var postCountKey = Thread.postCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function() {
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
      .finally(function() { postCountLock.release(); });
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
    if (thread.deleted) { updateThread.deleted = thread.deleted; }
    else { delete updateThread.deleted; }
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
  .then(function() {
    return syncThreadOrder(deletedThread);
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
    return db.metadata.getAsync(lastPostUsernameKey);
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
  console.log('here');
  return new Promise(function(fulfill, reject) {
    var entries = [];
    var sorter = function(value) {
      console.log(value);
      entries.push(value.value);
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
    var startKey = threadOrderPrefix + sep + boardId + sep + 'order' + sep;
    var endKey = startKey;
    startKey += '\x00';
    endKey += '\xff';

    // query counting
    var threadStart = limit * page - (limit - 1);
    threadStart = encodeIntHex(threadStart);
    startKey += threadStart;

    var queryOptions = {
      limit: limit,
      start: startKey,
      end: endKey
    };
    // query thread Index
    db.indexes.createReadStream(queryOptions)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

function syncThreadOrder(thread) {
  threadOrderLock.runwithlock(function() {
    // get current threadOrder
    var threadOrderKey = Thread.threadOrderKey(thread.id);
    return db.metadata.getAsync(threadOrderKey)
    // del current threadOrder and boardThreadOrder
    .then(function(threadOrder) {
      return db.metadata.delAsync(threadOrderKey)
      .then(function() { return threadOrder; });
    })
    // del current board
    .then(function(threadOrder) {
      var key = Thread.boardThreadOrderKey(thread.board_id, threadOrder);
      return db.indexes.delAsync(key)
      .then(function() { return threadOrder; });
    })
    // handle thread ordering in board
    .then(function(threadOrder) {
      return reorderThreadOrder(threadOrder, thread.board_id, thread.id)
      .then(function() { threadOrderLock.release(); });
    });
  });
}

function reorderThreadOrder(startIndex, boardId, threadId) {
  var threadOrderPrefix = Thread.indexPrefix;
  var sep = config.sep;
  startIndex = Number(startIndex);

  return new Promise(function(fulfill, reject) {
    var entries = [];
    var sorter = function(entry) { entries.push(entry); };
    var handler = function() { return fulfill(entries); };

    // query key
    var startKey = threadOrderPrefix + sep + boardId + sep + 'order' + sep;
    var endKey = startKey + '\xff';
    startKey += encodeIntHex(startIndex);
    var queryOptions = {
      start: startKey,
      end: endKey
    };
    // query for all posts fir this threadId
    db.indexes.createReadStream(queryOptions)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  })
  .then(function(entries) {
    var counter = startIndex;
    return Promise.each(entries, function(entry) {
      var threadOrderKey = Thread.threadOrderKey(entry.value);
      var key = threadOrderPrefix + sep + boardId + sep + 'order' + sep;
      key += encodeIntHex(counter);
      var value = entry.value;

      return db.metadata.putAsync(threadOrderKey, counter)
      .then(function() { counter = counter + 1; })
      .then(function() { return db.indexes.putAsync(key, value); });
    });
  });
}
