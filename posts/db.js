var posts = {};
module.exports = posts;
var path = require('path');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var threadsDb = require(path.join(__dirname, '..', 'threads', 'db'));
var async = require('async');

posts.insert = function(post) {
  return new Promise(function(fulfill, reject) {
    if (!post.thread_id) {
      reject('The thread_id isn\'t present for given Post.');
    }
    var timestamp = Date.now();
    post.created_at = timestamp;
    post.updated_at = timestamp;
    post.id = timestamp + uuid.v1({ msecs: timestamp });
    var threadPostCountKey = post.getThreadKey() + config.sep + 'post_count';
    return db.metadata.getAsync(threadPostCountKey)
    .then(function(count) {
      count = Number(count);
      var metadataBatch = [ { type: 'put', key: threadPostCountKey, value: count + 1 } ];
      if (count === 0) { // First Post
        var threadFirstPostIdKey = post.getThreadKey() + config.sep + 'first_post_id';
        metadataBatch.push({ type: 'put', key: threadFirstPostIdKey, value: post.id });
      }
      return db.metadata.batchAsync(metadataBatch);
    })
    .then(function() { return db.indexes.putAsync(post.getThreadPostKey(), post.id); })
    .then(function() { return { id: post.thread_id, title: post.title }; })
    .then(threadsDb.update)
    .then(function() { return db.content.putAsync(post.getKey(), post); })
    .then(function() { fulfill(post); });
  });
};

posts.remove = function(post) {
  return db.content.delAsync(post.getKey())
  .then(function() {
    return db.deleted.putAsync(post.getKey, post);
  })
  .then(function() {
    return post;
  });
};

posts.find = function(id) {
  return db.content.getAsync(config.posts.prefix + config.sep + id)
  .then(function(post) {
    return post;
  });
};

posts.byThread = function(threadId, opts) {
  return new Promise(function(fulfill, reject) {
    var values = [];
    var handler = function() {
      // get post id from each entry
      var postIds = values.map(function(postId) {
        return postId;
      });


      // get post for each postId
      async.concat(postIds,
        function(postId, callback) {
          posts.find(postId)
          .then(function(post) {
            callback(null, post);
          });
        },
        // return all posts
        function(err, allPosts) { return fulfill(allPosts); });
    };

    // query vars
    var limit = opts.limit ? Number(opts.limit) : 10;
    var startPostKey = config.posts.indexPrefix + config.sep + threadId + config.sep;
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
    .on('data', function (value) { values.push(value); })
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};