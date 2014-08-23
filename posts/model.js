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
  if (data.smf && data.smf.post_id) { this.smf  = data.smf; }
  this.thread_id = data.thread_id;
  this.body = data.body;
  this.title = data.title;

}

Post.prototype.getKey = function() {
  var key;
  if (this.id) {
    key = config.posts.prefix + config.sep + this.id;
  }
  return key;
};

Post.prototype.getThreadPostKey = function() {
  var key;
  if (this.id) {
    key = config.posts.indexPrefix + config.sep + this.thread_id + config.sep + this.id;
  }
  return key;
};

Post.prototype.getLegacyKey = function() {
  var key;
  if (this.smf && this.smf.post_id) {
    key = config.posts.prefix + config.sep + this.smf.post_id;
  }
  return key;
};

Post.prototype.getThreadKey = function() {
  var key;
  if (this.id) {
    key = config.threads.prefix + config.sep + this.thread_id;
  }
  return key;
};