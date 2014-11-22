var posts = {};
module.exports = posts;

var path = require('path');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var vault = require(path.join(__dirname, '..', 'vault'));
var db = require(path.join(__dirname, '..', 'db'));
var tree = db.tree;
var dbHelper = require(path.join(__dirname, '..', 'db', 'helper'));
var encodeIntHex = dbHelper.encodeIntHex;
var Post = require(path.join(__dirname, 'keys'));
var Thread = require(path.join(__dirname, '..', 'threads', 'keys'));
var Board = require(path.join(__dirname, '..', 'boards', 'keys'));
var User = require(path.join(__dirname, '..', 'users', 'keys'));
var helper = require(path.join(__dirname, '..', 'helper'));
var threadsDb = require(path.join(__dirname, '..', 'threads', 'db'));
var boardsDb = require(path.join(__dirname, '..', 'boards', 'db'));
var usersDb = require(path.join(__dirname, '..', 'users', 'db'));

posts.import = function(post) {
  var insertPost = function() {
    // insert post
    return posts.create(post)
    .then(function(dbPost) {
      if (dbPost.smf) {
        return db.legacy.putAsync(Post.legacyKey(dbPost.smf.ID_MSG), dbPost.id)
        .then(function() { return dbPost; });
      }
    });
  };

  post.imported_at = Date.now();
  var promise;
  if (post.smf.ID_MEMBER) {
    promise = db.legacy.getAsync(User.legacyKey(post.smf.ID_MEMBER))
    .then(function(userId) { post.user_id = userId; })
    .then(insertPost);
  }
  else {
    promise = insertPost();
  }
  return promise;
};

posts.create = function(post) {
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

  return storePost(post)
  .then(storePostVersion);
};

posts.find = function(id) {
  return new Promise(function(fulfill, reject) {
    tree.get(['post', id], function(err, storedPost) {
      if (err) { reject(err); }
      else { fulfill(storedPost); }
    });
  });
};

posts.update = function(post) {
  var postKey = Post.key(post.id);
  var updatePost = null;
  var threadFirstPostIdKey = Thread.firstPostIdKey(post.thread_id);

  // check if first post in thread
  return db.metadata.getAsync(threadFirstPostIdKey)
  .then(function(firstPostId) {
    if (firstPostId === post.id) {
      return db.metadata.putAsync(threadFirstPostIdKey, post.title)
      .then(function() { return; });
    }
    else { return; }
  })
  .then(function() {
    return db.content.getAsync(postKey); // get old post
  })
  .then(function(oldPost) {
    updatePost = oldPost;
    var timestamp = Date.now();

    // update post values
    if (post.title) { updatePost.title = post.title; }
    if (post.body) { updatePost.body = post.body; }
    if (post.encodedBody) { updatePost.encodedBody = post.encodedBody; }
    else if (post.encodedBody === null) { delete updatePost.encodedBody; }
    updatePost.updated_at = timestamp;
    updatePost.version = timestamp;

    // insert back into db
    return db.content.putAsync(postKey, updatePost);
  })
  .then(function() {
    // version already updated above
    var versionKey = Post.versionKey(updatePost.id, updatePost.version);
    return db.content.putAsync(versionKey, updatePost);
  })
  .then(function() { return updatePost; })
  .catch(function(err) { console.log(err); });
};

posts.delete = function(postId) {
  var postKey = Post.key(postId);
  var deletedPost = null;

  // see if post already exists
  return db.content.getAsync(postKey)
  .then(function(postData) {
    deletedPost = postData;
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
    var versionKey = Post.versionKey(deletedPost.id, deletedPost.version);
    return db.content.putAsync(versionKey, deletedPost);
  })
  .then(function() { return deletedPost; });
};

posts.undelete = function(postId) {
  var postKey = Post.key(postId);
  var deletedPost = null;

  // see if post already exists
  return db.content.getAsync(postKey)
  .then(function(postData) {
    deletedPost = postData;
    var timestamp = Date.now();

    // add deleted: true flag to board
    delete deletedPost.deleted;
    deletedPost.updated_at = timestamp;
    deletedPost.version = timestamp;

    // insert back into db
    return db.content.putAsync(postKey, deletedPost);
  })
  .then(function() {
    // version already updated above
    var versionKey = Post.versionKey(deletedPost.id, deletedPost.version);
    return db.content.putAsync(versionKey, deletedPost);
  })
  .then(function() { return deletedPost; });
};

/* deleting first post should remove thread */
posts.purge = function(id) {
  var postKey = Post.key(id);
  var deletedPost;
  var threadId;

  return db.content.getAsync(postKey) // get post
  .then(function(post) {
    deletedPost = post;
    return id;
  })
  .then(posts.versions)
  .then(function(versions) { // move versions to deleted db
    var batchArray = versions.map(function(version) {
      var versionKey = Post.versionKey(version.id, version.version);
      return { type: 'put', key: versionKey, value: version };
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
    var postOrderKey = Post.postOrderKey(id);
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
    var threadFirstPostIdKey = Thread.firstPostIdKey((deletedPost.thread_id));
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
      var legacyKey = Post.legacyKey(deletedPost.smf.ID_MSG);
      return db.legacy.delAsync(legacyKey);
    }
    else { return; }
  })
  .then(function() { return deletedPost; });
};

posts.postByOldId = function(oldId) {
  var legacyThreadKey = Post.legacyKey(oldId);

  return db.legacy.getAsync(legacyThreadKey)
  .then(posts.find);
};

posts.byThread = function(threadId, opts) {
  return new Promise(function(fulfill, reject) {
    var postIds = [];
    var sorter = function(value) { postIds.push(value); };
    var handler = function() { fulfill(postIds); };

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
    pageStart = encodeIntHex(pageStart);
    startKey += pageStart;

    var queryOptions = {
      limit: limit,
      gte: startKey,
      lte: endKey
    };
    // query for all posts fir this threadId
    db.indexes.createValueStream(queryOptions)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  })
  .then(function(postIds) {
    // get post for each postId
    return Promise.map(postIds, function(postId) {
      var post;
      return posts.find(postId)
      .then(function(dbPost) {
        post = dbPost;
        return usersDb.find(dbPost.user_id);
      })
      .then(function(user) {
        delete post.user_id;
        post.user = {
          id: user.id,
          username: user.username,
          signature: user.signature,
          avatar: user.avatar
        };
        return post;
      });
    });
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
      gte: searchKey,
      lte: searchKey + '\xff'
    };
    db.content.createValueStream(query)
    .on('data', sortVersions)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

// post: post, callback
function storePost(post) {
  return new Promise(function(fulfill, reject) {
    var newPostOptions = {
      parentKeys: [['thread', post.thread_id], ['user', post.user_id]],
      type: 'post',
      callback: function(options) {
        // get the key for the post
        var key = options.key;
        var value = options.value;
        if (options.err) {
          reject(options.err);
        }
        else {
          // fulfill with the new post's id
          post.id = key[i];
          fulfill(post);
        }
      };
    };
    tree.store(newPostOptions);
  });
};

function storePostVersion(post) {
  return new Promise(function(fulfill, reject) {
    var postWithoutId = JSON.parse(JSON.stringify(post));
    delete postWithoutId.id;
    var newPostVersion = {
      object: postWithoutId,
      parentKey: ['post', post.id],
      type: 'postVersion',
      callback: function(options) {
        if (options.err) {
          reject(options.err);
        }
        else {
          fulfill(post);
        }
      }
    };
    tree.store(newPostVersion);
  });
}
