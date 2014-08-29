var posts = {};
module.exports = posts;

var path = require('path');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Post = require(path.join(__dirname, 'model'));
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
        return db.legacy.putAsync(dbPost.getLegacyKey(), dbPost.id)
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
  if (!post.created_at) { post.created_at = timestamp; }
  post.updated_at = timestamp;
  post.id = helper.genId(post.created_at);
  var postUsername;
  return usersDb.find(post.user_id)
  .then(function(user) {
    postUsername = user.username;
    return threadsDb.incPostCount(post.thread_id);
  })
  .then(function(postCount) {
    postCount = Number(postCount);
    var postUsernameKey = post.getKey() + config.sep + 'username';
    var metadataBatch = [
      { type: 'put', key: postUsernameKey, value: postUsername }
    ];
    if (postCount === 1) { // First Post
      // TODO: Move key generation into models.
      var threadKeyPrefix = post.getThreadKey() + config.sep;
      var threadFirstPostIdKey = threadKeyPrefix + 'first_post_id';
      var threadTitleKey = threadKeyPrefix + 'title';
      var threadUsernameKey = threadKeyPrefix + 'username';
      metadataBatch.push({ type: 'put', key: threadFirstPostIdKey, value: post.id });
      metadataBatch.push({ type: 'put', key: threadTitleKey, value: post.title });
      metadataBatch.push({ type: 'put', key: threadUsernameKey, value: postUsername });
    }
    return db.metadata.batchAsync(metadataBatch);
  })
  .then(function() {
    return threadsDb.find(post.thread_id)
    .then(function(thread) {
      return boardsDb.incPostCount(thread.board_id);
    });
  })
  .then(function() {
    return db.indexes.putAsync(post.getThreadPostKey(), post.id);
  })
  .then(function() { return db.content.putAsync(post.getKey(), post); })
  .then(function() { return post; });
};

posts.find = function(id) {
  var post;
  var postKey = Post.getKeyFromId(id);
  var postUsernameKey = postKey + config.sep + 'username';
  return db.content.getAsync(postKey)
  .then(function(dbPost) {
    post = dbPost;
    return db.metadata.getAsync(postUsernameKey);
  })
  .then(function(postUsername) {
    post.user = {
      username: postUsername,
      id: post.user_id
    };
    delete post.user_id;
    return post;
  });
};

posts.update = function(post) {
  var postKey = post.getKey();
  var updatePost = null;

  var threadKeyPrefix = post.getThreadKey() + config.sep;
  var threadFirstPostIdKey = threadKeyPrefix + 'first_post_id';

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

    // update post values
    updatePost.title = post.title;
    updatePost.body = post.body;
    updatePost.deleted = post.deleted;
    updatePost.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(postKey, updatePost);
  })
  .then(function() { return updatePost; });
};

posts.delete = function(postId) {
  var postKey = Post.getKeyFromId(postId);
  var deletedPost = null;

  // see if post already exists
  return db.content.getAsync(postKey)
  .then(function(postData) {
    deletedPost = new Post(postData);

    // add deleted: true flag to board
    deletedPost.deleted = true;
    deletedPost.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(postKey, deletedPost);
  })
  .then(function() { return deletedPost; });
};

/* deleting first post should remove thread */
posts.purge = function(id) {
  var postKey = Post.getKeyFromId(id);
  var postUsernameKey = postKey + config.sep + 'username';
  var deletedPost;

  return db.content.getAsync(postKey) // get post
  .then(function(post) { deletedPost = new Post(post); })
  .then(function() { // move to deleted db
    return db.deleted.putAsync(postKey, deletedPost);
  })
  .then(function() { // remove from this db
    return db.content.delAsync(postKey);
  })
  .then(function() { // remove username metadata from db
    return db.metadata.delAsync(postUsernameKey);
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
    var threadPostKey = deletedPost.getThreadPostKey();
    return db.indexes.delAsync(threadPostKey);
  })
  // temporary solution to handling ThreadFirstPostIdKey
  .then(function() { // manage ThreadFirstPostIdKey
    var threadKeyPrefix = deletedPost.getThreadKey() + config.sep;
    var threadFirstPostIdKey = threadKeyPrefix + 'first_post_id';
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
  .then(function() {
    if (deletedPost.smf) {
      var legacyKey = deletedPost.getLegacyKey();
      return db.indexes.delAsync(legacyKey);
    }
    else { return; }
  })
  .then(function() { return deletedPost; });
};

posts.postByOldId = function(oldId) {
  var legacyThreadKey = Post.getLegacyKeyFromId(oldId);

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
