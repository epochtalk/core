var posts = {};
module.exports = posts;

var path = require('path');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Post = require(path.join(__dirname, 'model'));
var helper = require(path.join(__dirname, '..', 'helper'));

posts.import = function(post) {
  post.imported_at = Date.now();
  return posts.insert(post)
  .then(function(dbPost) {
    if (dbPost.smf) {
      return db.legacy.putAsync(dbPost.getLegacyKey(), dbPost.id)
      .then(function() { return dbPost; });
    }
  });
};

posts.insert = function(post) {
  if (!post.thread_id) {
    return Promise.reject('The thread_id isn\'t present for given Post.');
  }

  var timestamp = Date.now();
  if (!post.created_at) { post.created_at = timestamp; }
  post.updated_at = timestamp;
  post.id = helper.genId(post.created_at);
  var threadKeyPrefix = post.getThreadKey() + config.sep;
  var threadPostCountKey = threadKeyPrefix + 'post_count';

  return db.metadata.getAsync(threadPostCountKey)
  .then(function(count) {
    count = Number(count);
    var metadataBatch = [
      { type: 'put', key: threadPostCountKey, value: count + 1 }
    ];
    if (count === 0) { // First Post
      var threadFirstPostIdKey = threadKeyPrefix + 'first_post_id';
      var threadTitleKey = threadKeyPrefix + 'title';
      metadataBatch.push({ type: 'put', key: threadFirstPostIdKey, value: post.id });
      metadataBatch.push({ type: 'put', key: threadTitleKey, value: post.title });
    }
    return db.metadata.batchAsync(metadataBatch);
  })
  .then(function() {
    return db.indexes.putAsync(post.getThreadPostKey(), post.id);
  })
  .then(function() {
    return db.content.putAsync(post.getKey(), post);
  })
  .then(function() { return post; });
};

posts.find = function(id) {
  var postKey = Post.getKeyFromId(id);
  return db.content.getAsync(postKey)
  .then(function(post) {
    return post;
  });
};

posts.remove = function(id) {
  var postKey = Post.getKeyFromId(id);
  var deletedPost;
  return db.content.getAsync(postKey)
  .then(function(post) { deletedPost = new Post(post); })
  .then(function() {
    return db.deleted.putAsync(postKey, deletedPost);
  })
  .then(function() {
    return db.content.delAsync(postKey);
  })

  // delete any unnecessary keys
  // -- delete threadFirstPostIdKey???

  .then(function() { // update threadPostCount
    // generate the threadPostCountKey
    var threadKeyPrefix = deletedPost.getThreadKey() + config.sep;
    var threadPostCountKey = threadKeyPrefix + 'post_count';
    // get the original count
    return db.metadata.getAsync(threadPostCountKey)
    .then(function(count) {
      count = Number(count);
      count = count - 1;
      if (count < 0) { count = 0; }
      var metadataBatch = [
        { type: 'put', key: threadPostCountKey, value: count }
      ];
      return db.metadata.batchAsync(metadataBatch);
    });
  })
  .then(function() { // delete ThreadPostKey
    var threadPostKey = deletedPost.getThreadPostKey();
    return db.indexes.delAsync(threadPostKey);
  })
  .then(function() {
    return deletedPost;
  });
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