var posts = {};
module.exports = posts;

var async = require('async');
var path = require('path');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var sep = config.sep;
var postPrefix = config.posts.prefix;
var postIndexPrefix = config.posts.indexPrefix;
var threadPrefix = config.threads.prefix;
var helper = require(path.join(__dirname, '..', 'helper'));
var validator = require(path.join(__dirname, 'validator'));

/* IMPORT */
function importPost(post) {
  // set created_at and imported_at datetime
  var ts = Date.now();
  if(!post.created_at) { post.created_at = ts; }
  else { post.created_at = Date.parse(post.created_at) || post.created_ad; }
  post.imported_at = ts;
  
  var postId = helper.genId(post.created_at);
  post.id = postId;
  var threadId = post.thread_id;
  var threadPostKey = postIndexPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;

  var batchArray = [
    { type: 'put', key: threadPostKey, value: {id: postId} },
    { type: 'put', key: postKey, value: post }
  ];
  
  return db.content.batchAsync(batchArray)
  .then(function(value) {
    // handle smf post id mapping
    if (post.smf) {
      var smfId = post.smf.post_id.toString();
      var key = postPrefix + sep  + smfId;
      return db.indexes.putAsync(key, postId)
      .then(function() {
        return post;
      });
    }
    else { return post; }
  });
}

/* CREATE */
function createPost(post) {
  // set created_at datetime
  post.created_at = Date.now();
  var postId = helper.genId(post.created_at);
  post.id = postId;
  var threadId = post.thread_id;
  var threadKey = threadPrefix + sep + threadId;
  var threadPostKey = postIndexPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;

  var afterWrite;

  var threadPostCountKey = threadKey + sep + 'post_count';
  afterWrite = function() {
    return new Promise(function(fulfill, reject) {
      var startKey = postIndexPrefix + sep + threadId + sep;
      var endKey = startKey + '\xff';
      var postCount = 0;
      var handler = function() {
        return db.metadata.putAsync(threadPostCountKey, postCount)
        .then(function() {
          fulfill(post);
        });
      };

      db.content.createReadStream({start: startKey, end: endKey}) //TODO: No version for indexes, so no versionLimi?
      .on('data', function () { postCount += 1; }) //TODO: What do we do if its deleted?
      .on('error', reject)
      .on('close', handler)
      .on('end', handler);
    });
  };

  return db.content.putAsync(postKey, post)
  .then(function() {
    return db.indexes.putAsync(threadPostKey, postId);
  })
  .then(afterWrite);
}

/* RETRIEVE POST */
function findPost(postId) {
  var key = postPrefix + sep + postId;
  return db.content.getAsync(key);
}

/* UPDATE */
function updatePost(post) {
  var key = postPrefix + sep + post.id;

  // see if post already exists
  return db.content.getAsync(key)
  .then(function(oldPost) {
    // update old post
    oldPost.title = post.title;
    oldPost.body = post.body;

    // input options
    return [key, oldPost];
  })
  .spread(function(key, oldPost) {
    return db.content.putAsync(key, oldPost);
  })
  .then(function() {
    return post;
  });
}

/* DELETE */
function deletePost(postId) {
  // delete post with given postId
  var postKey = postPrefix + sep + postId;
  return db.content.getAsync(postKey)
  .then(function(postToDelete) {
    // collect all associated post indexes
    var associatedKeys = helper.associatedKeys(postToDelete);

    // delete each key and return post
    return Promise.all(associatedKeys.map(deleteItr))
    .then(function() { return postToDelete; });
  })
  .then(function(postToDelete) {
    return db.deleted.putAsync(postKey, postToDelete)
    .then(function() { return postToDelete; });
  });
}

/* QUERY: post using old id */
function postByOldId(oldId) {
  var key = postPrefix + sep + oldId;
  return db.legacy.getAsync(key)
  .then(function(postId) {
    return postId;
  });
}

/* QUERY: All the posts in one thread */
function byThread(threadId, opts) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    var handler = function() {
      // get post id from each entry
      var postIds = entries.map(function(entry) {
        return entry.value.id;
      });

      // get post for each postId
      async.concat(postIds,
        function(postId, callback) {
          findPost(postId)
          .then(function(post) {
            callback(null, post);
          });
        },
        // return all posts
        function(err, allPosts) { return fulfill(allPosts); });
    };

    // query vars
    var limit = opts.limit ? Number(opts.limit) : 10;
    var startPostKey = postIndexPrefix + sep + threadId + sep;
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
    db.createValueStream(queryOptions)
    .on('data', function (entry) { if (!entry.value.deleted) { entries.push(entry); } })
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
}

posts.import = function(post) {
  return validator.importPost(post, importPost);
};

posts.create = function(post) {
  return validator.createPost(post, createPost);
};

posts.find = function(id) {
  return validator.id(id, findPost);
};

posts.update = function(post) {
  return validator.updatePost(post, updatePost);
};

posts.delete = function(id) {
  return validator.id(id, deletePost);
};

posts.postByOldId = function(id) {
  return validator.id(id, postByOldId);
};

posts.byThread = function(id, opts) {
  return validator.byThread(id, opts, byThread);
};
