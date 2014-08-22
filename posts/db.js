var posts = {};
module.exports = posts;
var path = require('path');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));
var threadsDb = require(path.join(__dirname, '..', 'threads', 'db'));

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
    db.metadata.getAsync(threadPostCountKey)
    .then(function(count) {
      count = Number(count);
      var metadataBatch = [
        { type: 'put', key: threadPostCountKey, value: count + 1 },
      ];
      if (count === 0) { // First Post
        var threadFirstPostIdKey = post.getThreadKey() + config.sep + 'first_post_id';
        metadataBatch.push({ type: 'put', key: threadFirstPostIdKey, value: post.id });
      }
      return db.metadata.batchAsync(metadataBatch)
      .then(function() { return { id: post.thread_id, title: post.title }; })
      .then(threadsDb.update)
      .then(function() {
        return db.content.putAsync(post.getKey(), post)
          .then(function() { fulfill(post); });
        });
     });
  });
};

posts.remove = function(post) {
  return db.content.delAsync(post.getKey())
  .then(function() {
    db.deleted.putAsync(post.getKey, post);
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
