var threadsDb = {};
module.exports = threadsDb;

var path = require('path');
var Promise = require('bluebird');
var dbHelper = require(path.join(__dirname, '..', 'db', 'helper'));
var encodeIntHex = dbHelper.encodeIntHex;
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var tree = db.tree;
var posts = require(path.join(__dirname, '..', 'posts', 'db'));
var Thread = require(path.join(__dirname, 'keys'));
var helper = require(path.join(__dirname, '..', 'helper'));
var boardsDb = require(path.join(__dirname, '..', 'boards', 'db'));
var Padlock = require('padlock').Padlock;
var postCountLock = new Padlock();
var viewCountLock = new Padlock();
var threadOrderLock = new Padlock();
var vault = require(path.join(__dirname, '..', 'vault'));

threadsDb.import = function(thread) {
  thread.imported_at = Date.now();
  return threadsDb.create(thread)
  .then(function(dbThread) {
    if (dbThread.smf) {
      return db.legacy.putAsync(Thread.legacyKey(thread.smf.ID_TOPIC), dbThread.id)
      .then(function() { return dbThread; });
    }
  });
};

// thread must have a board_id
threadsDb.create = function(thread) {
  var timestamp = Date.now();
  // If created at doesnt exist
  if (!thread.created_at) {
    thread.created_at = timestamp;
  }
  return storeThread(thread);
};

threadsDb.delete = function(id) {
  // see if thread already exists
  return threadsDb.find(id)
  .then(function(threadData) {
    threadData.deleted = true;
    threadData.updated_at = Date.now();
    delete threadData.title;
    delete threadData.first_post_id;
    delete threadData.user;
    return threadData;
  })
  .then(storeThread);
};

threadsDb.undelete = function(id) {
  var threadKey = Thread.key(id);
  var deletedThread = null;

  // see if thread already exists
  return db.content.getAsync(threadKey)
  .then(function(threadData) {
    deletedThread = threadData;

    // add deleted: true flag to board
    delete deletedThread.deleted;
    deletedThread.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(threadKey, deletedThread);
  })
  .then(function() { return deletedThread; });
};

threadsDb.purge = function(id) {
  var deletedThread;
  var threadKey = Thread.key(id);
  var postCountKey = Thread.postCountKey(id);
  var lastPostUsernameKey = Thread.lastPostUsernameKey(id);
  var lastPostCreatedAtKey = Thread.lastPostCreatedAtKey(id);
  var viewCountKey = Thread.viewCountKey(id);
  var firstPostIdKey = Thread.firstPostIdKey(id);
  var postTitleKey = Thread.titleKey(id);
  var usernameKey = Thread.usernameKey(id);
  return db.content.getAsync(threadKey) // get thread
  .then(function(thread) {
    deletedThread = thread;
  })
  .then(function() { // save view count to deletedThread
    return db.metadata.getAsync(viewCountKey)
    .then(function(viewCount) {
      deletedThread.view_count = viewCount;
    })
    .then(function() {
      return db.metadata.delAsync(viewCountKey);
    });
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
      var boardThreadKey = Thread.boardThreadKey(deletedThread.id, deletedThread.board_id, timestamp);
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
  .then(function() { // decrement board thread count
    var boardId = deletedThread.board_id;
    return boardsDb.decThreadCount(boardId);
  })
  .then(function() {
    if (deletedThread.smf) {
      var legacyKey = Thread.legacyKey(deletedThread.smf.ID_TOPIC);
      return db.legacy.delAsync(legacyKey);
    }
    else { return; }
  })
  .then(function() { return deletedThread; });
};

threadsDb.find = function(id) {
  return new Promise(function(fulfill, reject) {
    tree.get(['thread', id], function(err, storedThread) {
      if (err) { reject(err); }
      else {
        // Get first post
        posts.byThread(id, {limit: 1})
        .then(function(firstPost) {
          // Fill in first post's data
          storedThread.value.title = firstPost[0].title;
          storedThread.value.first_post_id = firstPost[0].id;
          storedThread.value.user = firstPost[0].user.username;
        })
        .then(function() {
          fulfill(storedThread);
        });
      }
    });
  })
  .then(helper.decMetadata);
};

threadsDb.threadByOldId = function(oldId) {
  var legacyThreadKey = Thread.legacyKey(oldId);

  return db.legacy.getAsync(legacyThreadKey)
  .then(threadsDb.find);
};

threadsDb.byBoard = function(boardId, opts) {
  return new Promise(function(fulfill, reject) {
    var threadIds = [];
    var options = {};
    options.parentKey = ['board', boardId];
    options.type = 'thread';
    options.indexedField = 'updated_at';
    options.limit = opts.limit;
    tree.children(options)
    .on('data', function(thread) {
      // add to threadIds
      threadIds.push(thread.key[1]);
    })
    .on('end', function() {
      fulfill(threadIds);
    })
    .on('error', function(err) {
      reject(err);
    });
  })
  .then(function(threadIds) {
    return Promise.map(threadIds, function(threadId) {
      return threadsDb.find(threadId);
    });
  });
};

function storeThread(thread) {
  return new Promise(function(fulfill, reject) {
    thread.updated_at = Date.now();
    var newThread = {
      object: thread,
      parentKeys: [['board', thread.board_id]],
      type: 'thread',
      callback: function(options) {
        var storedThread = options.value;
        if (options.err) {
          reject(options.err);
        }
        else {
          storedThread.id = options.key[1];
          fulfill(storedThread);
        }
      }
    };
    tree.store(newThread);
  });
};
