var posts = {};
module.exports = posts;

var path = require('path');
var Promise = require('bluebird');
var bytewise = require('bytewise');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Post = require(path.join(__dirname, 'model'));
var Thread = require(path.join(__dirname, '..', 'threads', 'model'));
var Board = require(path.join(__dirname, '..', 'boards', 'model'));
var User = require(path.join(__dirname, '..', 'users', 'model'));
var helper = require(path.join(__dirname, '..', 'helper'));
var threadsDb = require(path.join(__dirname, '..', 'threads', 'db'));
var boardsDb = require(path.join(__dirname, '..', 'boards', 'db'));
var usersDb = require(path.join(__dirname, '..', 'users', 'db'));

posts.import = function(post) {
  var insertPost = function() {
    return posts.insert(post)
    .then(function(dbPost) {
      if (dbPost.smf) {
        return db.legacy.putAsync(dbPost.legacyKey(), dbPost.id)
        .then(function() { return dbPost; });
      }
    });
  };

  post.imported_at = Date.now();
  var promise;
  if (post.smf.ID_MEMBER) {
    promise = db.legacy.getAsync(User.legacyKeyFromId(post.smf.ID_MEMBER))
    .then(function(userId) {
      post.user_id = userId;
    })
    .then(insertPost);
  }
  else {
    promise = insertPost();
  }
  return promise;
};

posts.insert = function(post) {
  if (!post.thread_id) {
    return Promise.reject('The thread_id isn\'t present for given Post.');
  }

  var timestamp = Date.now();
  // If post created at isn't defined
  if (!post.created_at) {
    post.created_at = timestamp;
    post.updated_at = timestamp;
  }
  // If post created at is defined but updated at isn't
  else if (!post.updated_at) {
    post.updated_at = post.created_at;
  }
  post.id = helper.genId(post.created_at);

  var postUsername, boardId, threadTitle, postCount, thread;
  return usersDb.find(post.user_id)
  .then(function(user) {
    postUsername = user.username;
    return threadsDb.incPostCount(post.thread_id);
  })
  .then(function(count) {
    postCount = Number(count);
    var metadataBatch = [];

    if (postCount === 1) { // First Post
      var threadId = post.thread_id;
      var threadFirstPostIdKey = Thread.firstPostIdKeyFromId(threadId);
      var threadTitleKey = Thread.titleKeyFromId(threadId);
      var threadUsernameKey = Thread.usernameKeyFromId(threadId);
      metadataBatch = [
        { type: 'put', key: threadFirstPostIdKey, value: post.id },
        { type: 'put', key: threadTitleKey, value: post.title },
        { type: 'put', key: threadUsernameKey, value: postUsername }
      ];
    }

    // post order metadata
    var postOrderKey = post.postOrderKey();
    metadataBatch.push({ type: 'put', key: postOrderKey, value: postCount });

    return db.metadata.batchAsync(metadataBatch);
  })
  .then(function() { return threadsDb.find(post.thread_id); })
  .then(function(dbThread) {
    boardId = dbThread.board_id;
    threadTitle = dbThread.title;
    thread = new Thread(dbThread);
    return boardsDb.incPostCount(boardId);
  })
  .then(function() {
    // get current thread last updated at timestamp
    var threadLastPostCreatedAtKey = Thread.lastPostCreatedAtKeyFromId(post.thread_id);
    return db.metadata.getAsync(threadLastPostCreatedAtKey);
  })
  .then(function(oldTimestamp) {
    // only remove if post.created_at is newer
    if (post.created_at >= oldTimestamp) {
      // build metadata batch array
      var threadLastPostUsernameKey = Thread.lastPostUsernameKeyFromId(post.thread_id);
      var threadLastPostCreatedAtKey = Thread.lastPostCreatedAtKeyFromId(post.thread_id);
      var metadataBatch = [
        { type: 'put', key: threadLastPostUsernameKey, value: postUsername },
        { type: 'put', key: threadLastPostCreatedAtKey, value: post.created_at }
      ];
      var metadata = {
        username: postUsername,
        createdAt: post.created_at,
        threadTitle: threadTitle,
        threadId: post.thread_id
      };
      // build and insert metadata
      return buildMetadataBatch(boardId, metadata, metadataBatch)
      .then(function(metadataBatch) {
        return db.metadata.batchAsync(metadataBatch);
      })
      // update board thread key index
      .then(function() {
        // old thread index
        var oldBoardThreadKey = thread.boardThreadKey(oldTimestamp);
        // add new thread index value
        var newBoardThreadKey = thread.boardThreadKey(post.created_at);
        var indexBatch = [
          { type: 'del', key: oldBoardThreadKey },
          { type: 'put', key: newBoardThreadKey, value: post.thread_id }
        ];
        return db.indexes.batchAsync(indexBatch);
      });
    }
    else { return; }
  })
  .then(function() { // threadPostOrder
    var key = post.threadPostOrderKey(postCount);
    return db.indexes.putAsync(key, post.id);
  })
  .then(function() {
    post.version = timestamp; // add version
    var versionKey = post.versionKey();
    return db.content.putAsync(versionKey, post);
  })
  .then(function() { return db.content.putAsync(post.key(), post); })
  .then(function() { return post; });
};

var buildMetadataBatch = function(boardId, metadata, batchArray) {
  if (!boardId) { return batchArray; }
  var boardKey = Board.keyFromId(boardId);
  return db.content.getAsync(boardKey)
  .then(function(board) {
    var boardLastPostUsernameKey = Board.lastPostUsernameKeyFromId(boardId);
    var boardLastPostCreatedAtKey = Board.lastPostCreatedAtKeyFromId(boardId);
    var boardLastThreadTitleKey = Board.lastThreadTitleKeyFromId(boardId);
    var boardLastThreadIdKey = Board.lastThreadIdKeyFromId(boardId);
    batchArray.push({ type: 'put', key: boardLastPostUsernameKey, value: metadata.username });
    batchArray.push({ type: 'put', key: boardLastPostCreatedAtKey, value: metadata.createdAt });
    batchArray.push({ type: 'put', key: boardLastThreadTitleKey, value: metadata.threadTitle });
    batchArray.push({ type: 'put', key: boardLastThreadIdKey, value: metadata.threadId });
    return buildMetadataBatch(board.parent_id, metadata, batchArray);
  });
};

posts.find = function(id) {
  var postKey = Post.keyFromId(id);
  var postUsernameKey = Post.usernameKeyFromId(id);
  return db.content.getAsync(postKey)
  .then(function(post) { return post; });
};

posts.update = function(post) {
  var postKey = post.key();
  var updatePost = null;
  var threadFirstPostIdKey = Thread.firstPostIdKeyFromId(post.thread_id);

  // check if first post in thread
  return db.metadata.getAsync(threadFirstPostIdKey)
  .then(function(firstPostId) {
    if (firstPostId === post.id) {
      return db.metadata.putAsync(threadFirstPostIdKey, post.title)
      .then(function() { return postKey; });
    }
    return postKey;
  })
  .then(function(key) {
    return db.content.getAsync(key); // get old post
  })
  .then(function(oldPost) {
    updatePost = new Post(oldPost);
    var timestamp = Date.now();

    // update post values
    if (post.title) { updatePost.title = post.title; }
    if (post.body) { updatePost.body = post.body; }
    if (post.deleted) { updatePost.deleted = post.deleted; }
    else { delete updatePost.deleted; }
    updatePost.updated_at = timestamp;
    updatePost.version = timestamp;

    // insert back into db
    return db.content.putAsync(postKey, updatePost);
  })
  .then(function() {
    // version already updated above
    var versionKey = updatePost.versionKey();
    return db.content.putAsync(versionKey, updatePost);
  })
  .then(function() { return updatePost; });
};

posts.delete = function(postId) {
  var postKey = Post.keyFromId(postId);
  var deletedPost = null;

  // see if post already exists
  return db.content.getAsync(postKey)
  .then(function(postData) {
    deletedPost = new Post(postData);
    var timestamp = Date.now();

    // add deleted: true flag to board
    deletedPost.deleted = true;
    deletedPost.updated_at = timestamp;
    deletedPost.version = timestamp;

    // insert back into db
    return db.content.putAsync(postKey, deletedPost);
  })
  .then(function() {
    // version already updated above
    var versionKey = deletedPost.versionKey();
    return db.content.putAsync(versionKey, deletedPost);
  })
  .then(function() { return deletedPost; });
};

/* deleting first post should remove thread */
posts.purge = function(id) {
  var postKey = Post.keyFromId(id);
  var deletedPost;
  var threadId;

  return db.content.getAsync(postKey) // get post
  .then(function(post) {
    deletedPost = new Post(post);
    return id;
  })
  .then(posts.versions)
  .then(function(versions) { // move versions to deleted db
    var batchArray = versions.map(function(version) {
      var post = Post(version);
      return { type: 'put', key: post.versionKey(), value: post };
    });
    return db.deleted.batchAsync(batchArray)
    .then(function() {
      batchArray = batchArray.map(function(item) {
        item.type = 'del';
        delete item.value;
        return item;
      });
      return db.content.batchAsync(batchArray);
    });
  })
  .then(function() { // remove from this db
    return db.content.delAsync(postKey);
  })
  .then(function() { // decrement threadPostCount
    return threadsDb.decPostCount(deletedPost.thread_id);
  })
  .then(function() { // decrement boardPostCount
    return threadsDb.find(deletedPost.thread_id)
    .then(function(thread) {
      threadId = thread.id;
      return boardsDb.decPostCount(thread.board_id);
    });
  })
  .then(function() { // delete ThreadPostOrder and PostOrder
    var postOrderKey = deletedPost.postOrderKey();
    return db.metadata.getAsync(postOrderKey)
    .then(function(postOrder) {
      return db.metadata.delAsync(postOrderKey)
      .then(function() { return postOrder; });
    })
    .then(function(postOrder) {
      var order = Number(postOrder);
      return reorderPostOrder(threadId, order);
    });
  })
  // temporary solution to handling ThreadFirstPostIdKey (first post)
  .then(function() { // manage ThreadFirstPostIdKey
    var threadFirstPostIdKey = Thread.firstPostIdKeyFromId((deletedPost.thread_id));
    return db.metadata.getAsync(threadFirstPostIdKey)
    .then(function(postId) {
      if (postId === deletedPost.id) {
        // remove key
        return db.metadata.delAsync(threadFirstPostIdKey);
      }
      else { return; }
    });
  })
  // temporarily not handling lastPostCreatedAtKey (last post)
  // temporarily not hanlding lastPostUsernameKey
  // temporarily not handling threadTitle (first post)
  // temporarily not handling lastThreadId
  // temporarily not handling thread username (first post)
  .then(function() { // delete legacy key
    if (deletedPost.smf) {
      var legacyKey = deletedPost.legacyKey();
      return db.legacy.delAsync(legacyKey);
    }
    else { return; }
  })
  .then(function() { return deletedPost; });
};

posts.postByOldId = function(oldId) {
  var legacyThreadKey = Post.legacyKeyFromId(oldId);

  return db.legacy.getAsync(legacyThreadKey)
  .then(function(postId) {
    return posts.find(postId);
  });
};

posts.byThread = function(threadId, opts) {
  return new Promise(function(fulfill, reject) {
    var postIds = [];
    var sorter = function(value) { postIds.push(value); };
    var handler = function() {
      // get post for each postId
      Promise.map(postIds, function(postId) {
        var post;
        return posts.find(postId)
        .then(function(dbPost) {
          post = dbPost;
          return usersDb.find(dbPost.user_id);
        })
        .then(function(user) {
          delete user.passhash;
          delete user.id;
          delete post.user_id;
          post.user = user;
          return post;
        });
      })
      .then(function(allPosts) {
        return fulfill(allPosts);
      });
    };

    // query vars
    var limit = opts.limit ? Number(opts.limit) : 10;
    var page = opts.page ? Math.abs(Number(opts.page)) : 1;

    // query key
    var postOrderPrefix = config.posts.indexPrefix;
    var sep = config.sep;
    var startKey = postOrderPrefix + sep + threadId + sep;
    var endKey = startKey + '\xff';

    // query start value
    var pageStart = limit * page - (limit - 1);
    pageStart = encode(pageStart, 'hex');
    startKey += pageStart;

    var queryOptions = {
      limit: limit,
      start: startKey,
      end: endKey
    };
    // query for all posts fir this threadId
    db.indexes.createValueStream(queryOptions)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

posts.versions = function(id) {
  return new Promise(function(fulfill, reject) {
    var postVersions = [];
    var sortVersions = function(post) {
      postVersions.push(post);
    };
    var handler = function() {
      fulfill(postVersions);
    };

    var searchKey = config.posts.version + config.sep + id + config.sep;
    var query = {
      start: searchKey,
      end: searchKey + '\xff'
    };
    db.content.createValueStream(query)
    .on('data', sortVersions)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

function reorderPostOrder(threadId, startIndex) {
  return new Promise(function(fulfill, reject) {
    var lastIndex = '';
    var mover = function(entry) {
      var key = entry.key;
      var value = entry.value;

      // find index from key
      var indexStart = Post.indexPrefix + sep + threadId + sep;
      var currentIndex = key.replace(indexStart, '');
      lastIndex = Number(currentIndex);
      var newIndex = lastIndex - 1;

      // handle metadata
      var metadataKey = Post.prefix + sep + value + sep + 'post_order';
      db.metadata.putAsync(metdataKey, newIndex);

      // handle index
      var postOrderKey = Post.indexPrefix + sep + threadId + sep;
      postOrderKey += encode(newIndex, 'hex');
      db.indexes.putAsync(postOrderKey, value);
    };
    var handler = function() {
      if (lastIndex === '') { lastIndex = startIndex; }
      lastIndex = Number(lastIndex);

      // delete last index position
      var key = Post.indexPrefix + sep + threadId + sep;
      key += encode(lastIndex, 'hex');
      db.indexes.delAsync(key);
      return fulfill();
    };

    // query key
    startIndex = Number(startIndex);
    var postOrderPrefix = Post.indexPrefix;
    var sep = config.sep;
    var startKey = postOrderPrefix + sep + threadId + sep;
    var endKey = startKey + '\xff';
    startKey += encode(startIndex + 1, 'hex');
    var queryOptions = {
      start: startKey,
      end: endKey
    };
    // query for all posts fir this threadId
    db.indexes.createReadStream(queryOptions)
    .on('data', mover)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
}

function encode(value, encoding) {
  return bytewise.encode(value).toString(encoding || 'binary');
}

