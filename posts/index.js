var posts = {};
module.exports = posts;
var path = require('path');
var pre = require(path.join(__dirname, 'pre'));
var postsDb = require(path.join(__dirname, 'db'));
var Post = require(path.join(__dirname, 'model'));
var validate = require(path.join(__dirname, 'validate'));

posts.import = function(data) {
  data = pre.parseBody(data);
  return validate.import(data)
  .then(function() {
    return postsDb.import(data);
  });
};

posts.create = function(data) {
  data = pre.parseBody(data);
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
  data = pre.parseBody(data);
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
  .then(function(post) {
    return post.simple();
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
