var posts = {};
module.exports = posts;
var path = require('path');
var postsDb = require(path.join(__dirname, 'db'));
var Post = require(path.join(__dirname, 'model'));

posts.import = function(data) {
  var newPost = new Post(data);
  return postsDb.import(newPost)
  .then(function(post) {
    return post;
  });
};

posts.create = function(data) {
  var newPost = new Post(data);
  return postsDb.insert(newPost)
  .then(function(post) {
    return post;
  });
};

posts.find = function(id) {
  return postsDb.find(id)
  .then(function(post) {
    return post;
  });
};

posts.byThread = function(id, opts) {
  return postsDb.byThread(id, opts)
  .then(function(posts) {
    return posts;
  });
};

posts.delete = function(data) {
  var postToDelete = new Post(data);
  return postsDb.remove(postToDelete)
  .then(function(post) {
    return post;
  });
};
