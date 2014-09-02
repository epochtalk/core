var posts = {};
module.exports = posts;

var path = require('path');
var Promise = require('bluebird');
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
    promise = db.legacy.getAsync(User.legacyKeyForId(post.smf.ID_MEMBER))
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
  var postUsername, boardId, threadTitle;
  return usersDb.find(post.user_id)
  .then(function(user) {
    postUsername = user.username;
    return threadsDb.incPostCount(post.thread_id);
  })
  .then(function(postCount) {
    postCount = Number(postCount);
    if (postCount === 1) { // First Post
      var threadId = post.thread_id;
      var threadFirstPostIdKey = Thread.firstPostIdKeyFromId(threadId);
      var threadTitleKey = Thread.titleKeyFromId(threadId);
      var threadUsernameKey = Thread.usernameKeyFromId(threadId);
      var metadataBatch = [
        { type: 'put', key: threadFirstPostIdKey, value: post.id },
        { type: 'put', key: threadTitleKey, value: post.title },
        { type: 'put', key: threadUsernameKey, value: postUsername }
      ];
      return db.metadata.batchAsync(metadataBatch);
    }
    else { return; }
  })
  .then(function() {
    return threadsDb.find(post.thread_id);
  })
  .then(function(thread) {
    boardId = thread.board_id;
    threadTitle = thread.title;
    return boardsDb.incPostCount(boardId);
  })
  .then(function() { // Last Post Info, Thread/Board Metadata is updated on each post insert
    var boardLastPostUsernameKey = Board.lastPostUsernameKeyFromId(boardId);
    var boardLastPostCreatedAtKey = Board.lastPostCreatedAtKeyFromId(boardId);
    var boardLastThreadTitleKey = Board.lastThreadTitleKeyFromId(boardId);
    var threadLastPostUsernameKey = Thread.lastPostUsernameKeyFromId(post.thread_id);
    var threadLastPostCreatedAtKey = Thread.lastPostCreatedAtKeyFromId(post.thread_id);
    var metadataBatch = [
      { type: 'put', key: boardLastPostUsernameKey, value: postUsername },
      { type: 'put', key: boardLastPostCreatedAtKey, value: post.created_at },
      { type: 'put', key: boardLastThreadTitleKey, value: threadTitle },
      { type: 'put', key: threadLastPostUsernameKey, value: postUsername },
      { type: 'put', key: threadLastPostCreatedAtKey, value: post.created_at }
    ];
    return db.metadata.batchAsync(metadataBatch);
  })
  .then(function() {
    return db.indexes.putAsync(post.threadPostKey(), post.id);
  })
  .then(function() {
    post.version = timestamp; // add version
    var versionKey = post.versionKey();
    return db.content.putAsync(versionKey, post);
  })
  .then(function() { return db.content.putAsync(post.key(), post); })
  .then(function() { return post; });
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
    updatePost.title = post.title;
    updatePost.body = post.body;
    updatePost.deleted = post.deleted;
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
      return boardsDb.decPostCount(thread.board_id);
    });
  })
  .then(function() { // delete ThreadPostKey
    var threadPostKey = deletedPost.threadPostKey();
    return db.indexes.delAsync(threadPostKey);
  })
  // temporary solution to handling ThreadFirstPostIdKey
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
  // temporarily not handling threadTitle
  // temporarily not handling thread username
  .then(function() {
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
        return posts.find(postId);
      })
      .then(function(allPosts) {
        return fulfill(allPosts);
      });
    };

    // query vars
    var limit = opts.limit ? Number(opts.limit) : 10;
    var sep = config.sep;
    var indexPrefix = config.posts.indexPrefix;
    var startPostKey = indexPrefix + sep + threadId + sep;
    var endIndexKey = startPostKey;
    if (opts.startPostId) {
      endIndexKey += opts.startPostId;
      startPostKey += '\xff';
    }
    else {
      endIndexKey += '\xff';
    }
    var queryOptions = {
      limit: limit,
      end: endIndexKey,
      start: startPostKey
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
