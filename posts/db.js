var posts = {};
module.exports = posts;
var path = require('path');
var uuid = require('node-uuid');
var db = require(path.join(__dirname, '..', 'db'));

posts.insert = function(post) {
  var timestamp = Date.now();
  post.created_at = timestamp;
  post.updated_at = timestamp;
  post.id = timestamp + uuid.v1({ msecs: timestamp });

  return db.content.putAsync(post.getKey(), post)
  .then(function() {
    return post;
  });
}

posts.remove = function(post) {
  return db.content.delAsync(post.getKey())
  .then(function() {
    db.deleted.putAsync(post.getKey, post);
  })
  .then(function() {
    return post;
  });
}

