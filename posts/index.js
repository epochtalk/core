var posts = {};
module.exports = posts;
var path = require('path');
var postsDb = require(path.join(__dirname, 'db'));
var Post = require(path.join(__dirname, 'model'));

posts.import = function(data) {
  var newPost = new Post(data);
  return newPost.validateImport()
  .then(function() {
    return postsDb.import(newPost);
  })
  .then(function(post) {
    return post.simple();
  });
};

posts.create = function(data) {
  var newPost = new Post(data);
  return newPost.validateCreate()
  .then(function() {
    return postsDb.insert(newPost);
  })
  .then(function(post) {
    return post.simple();
  });
};

posts.find = function(id) {
  return postsDb.find(id);
};

posts.update = function(data) {
  var updatePost = new Post(data);
  return updatePost.validateCreate()
  .then(function() {
    return postsDb.update(updatePost);
  })
  .then(function(post) {
    return post.simple();
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
  return postsDb.postByOldId(oldId);
};

posts.byThread = function(threadId, opts) {
  return postsDb.byThread(threadId, opts); // all already simple
};

posts.versions = function(id) {
  return postsDb.versions(id); // all already simple
};
