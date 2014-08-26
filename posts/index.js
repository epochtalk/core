var posts = {};
module.exports = posts;
var path = require('path');
var postsDb = require(path.join(__dirname, 'db'));
var Post = require(path.join(__dirname, 'model'));

posts.import = function(data) {
  var newPost = new Post(data);
  return newPost.validate()
  .then(function() {
    return postsDb.import(newPost);
  })
  .then(function(post) {
    return post.simple();
  });
};

posts.create = function(data) {
  var newPost = new Post(data);
  return newPost.validate()
  .then(function() {
    return postsDb.insert(newPost);
  })
  .then(function(post) {
    return post.simple();
  });
};

posts.find = function(id) {
  return postsDb.find(id)
  .then(function(post) {
    return post; // already simple
  });
};

posts.delete = function(id) {
  return postsDb.delete(id)
  .then(function(post) {
    return post.simple();
  });
};

posts.purge = function(id) {
  return postsDb.purge(id)
  .then(function(board) {
    return board.simple();
  });
};

posts.postByOldId = function(oldId) {
  return postsDb.postByOldId(oldId)
  .then(function(post) {
    return post;
  });
};

posts.byThread = function(threadId, opts) {
  return postsDb.byThread(threadId, opts)
  .then(function(posts) {
    return posts; // all already simple
  });
};
