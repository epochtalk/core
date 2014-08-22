module.exports = Post;
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));

function Post(data) {
  if (!(this instanceof Post)) {
    return new Post(data);
  }
  // data.id signifies existing post
  if (data.id) {
    this.id = data.id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
  this.thread_id = data.thread_id;
  this.body = data.body;
  this.title = data.title;
}

Post.prototype.getKey = function() {
  return config.posts.prefix + config.sep + this.id;
};

Post.prototype.getThreadKey = function() {
  return config.threads.prefix + config.sep + this.thread_id;
};