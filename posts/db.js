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
    return storePost(post)
    .then(storePostVersion);
  };

  post.imported_at = post.created_at = Date.now();
  var promise;
  if (post.smf.ID_MEMBER) {
    // get user id from legacy key
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
  post.created_at = timestamp;
  return storePost(post)
  .then(storePostVersion);
};

posts.find = function(id) {
  return new Promise(function(fulfill, reject) {
    var storedPost;
    var options = {
      limit: 1,
      reverse: true,
      parentKey: ['post', id],
      type: 'postVersion',
      indexedField: 'updated_at'
    };
    tree.children(options)
    .on('data', function(post) {
      storedPost = post.value;
      storedPost.id = id;
    })
    .on('error', function(error) {
      reject(error);
    })
    .on('end', function() {
      fulfill(storedPost);
    });
  })
  .then(function(postVersion) {
    return new Promise(function(fulfill, reject) {
      tree.get(['post', id], function(err, post) {
        if (err) {
          reject(err);
        }
        else {
          postVersion.created_at = post.value.created_at;
          if (post.value.imported_at) {
            postVersion.smf = post.value.smf;
            postVersion.imported_at = post.value.imported_at;
          }
          fulfill(postVersion);
        }
      });
    });
  });
};

posts.update = function(updates) {
  // find original post
  return posts.find(updates.id)
  .then(function(foundPost) {
    // if new thread_id
    // delete old relationship
    // create new relationship
    foundPost.body = updates.body || foundPost.body;
    foundPost.encodedBody = updates.encodedBody || foundPost.encodedBody;
    foundPost.thread_id = updates.thread_id || foundPost.thread_id;
    foundPost.title = updates.title || foundPost.title;
    return foundPost;
  })
  .then(storePostVersion);
};

posts.delete = function(postId) {
  // see if post already exists
  return posts.find(postId)
  .then(function(postData) {
    postData.deleted = true;
    return postData;
  })
  .then(storePostVersion);
};

posts.undelete = function(postId) {
  // see if post already exists
  return posts.find(postId)
  .then(function(postData) {
    delete postData.deleted;
    return postData;
  })
  .then(storePostVersion);
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
  return new Promise(function(fulfill, reject) {
    var storedPostId;
    tree.nodes({agnostic: true, type: 'post', indexedField: 'smf.ID_MSG', indexedValue: oldId})
    .on('data', function(post) {
      console.log('found', post);
      storedPostId = post.key[1];
    })
    .on('end', function() {
      fulfill(storedPostId);
    })
    .on('err', function(err) {
      reject(err);
    });
  })
  .then(function(postId) {
    return posts.find(postId);
  });
};

posts.byThread = function(threadId, opts) {
  return new Promise(function(fulfill, reject) {
    var postIds = [];
    var options = {};
    options.parentKey = ['thread', threadId];
    options.type = 'post';
    options.indexedField = 'created_at';
    options.limit = opts.limit;
    tree.children(options)
    .on('data', function(post) {
      // add to postIds
      postIds.push(post.key[1]);
    })
    .on('end', function() {
      fulfill(postIds);
    });
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
    var options = {
      reverse: true,
      parentKey: ['post', id],
      type: 'postVersion',
      indexedField: 'updated_at'
    };
    tree.children(options)
    .on('data', function(postVersionObject) {
      var postVersion = postVersionObject.value;
      postVersion.id = postVersionObject.key[1];
      postVersions.push(postVersion);
    })
    .on('error', function(error) {
      reject(error);
    })
    .on('end', function() {
      fulfill(postVersions);
    });
  })
  .then(function(postVersions) {
    return new Promise(function(fulfill, reject) {
      tree.get(['post', id], function(err, post) {
        if (err) {
          reject(err);
        }
        else {
          postVersions.forEach(function(postVersion) {
            postVersion.created_at = post.value.created_at;
            if (post.value.imported_at) {
              postVersion.smf = post.value.smf;
              postVersion.imported_at = post.value.imported_at;
            }
          });
          fulfill(postVersions);
        }
      });
    });
  });
};

// post: post, callback
function storePost(post) {
  return new Promise(function(fulfill, reject) {
    var valuesToStore = {};
    valuesToStore.created_at = post.created_at;
    if (post.imported_at) {
      valuesToStore.smf = post.smf;
      valuesToStore.imported_at = post.imported_at;
    }
    var newPostOptions = {
      parentKeys: [['thread', post.thread_id], ['user', post.user_id]],
      type: 'post',
      // TODO: this is a workaround
      // posts should be indexed by metadata
      // created_at
      object: valuesToStore,
      callback: function(options) {
        // get the key for the post
        var key = options.key;
        var value = options.value;
        if (options.err) {
          reject(options.err);
        }
        else {
          // fulfill with the new post's id
          post.id = key[1];
          fulfill(post);
        }
      }
    };
    tree.store(newPostOptions);
  });
};

function storePostVersion(post) {
  return new Promise(function(fulfill, reject) {
    post.version = post.updated_at = Date.now();
    var postWithoutId = JSON.parse(JSON.stringify(post));
    delete postWithoutId.id;
    delete postWithoutId.smf;
    delete postWithoutId.imported_at;
    delete postWithoutId.created_at;
    var newPostVersion = {
      object: postWithoutId,
      parentKeys: [['post', post.id]],
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
