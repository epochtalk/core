module.exports = Post;
var _ = require('lodash');
var uuid = require('node-uuid');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));

function Post(data) {
  if (!(this instanceof Post)) {
    return new Post(json);
  }
  // data.id signifies existing post
  if (data.id) {
    this.id = data.id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
  this.body = data.body;
}

Post.prototype.getKey = function() {
  return config.posts.prefix + config.sep + this.id;
}
