module.exports = Post;
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var schema = require(path.join(__dirname, 'schema'));
var indexPrefix = config.posts.indexPrefix;
var prefix = config.posts.prefix;
var sep = config.sep;

// helper functions

var keyForPost = function(id) {
  var postKey;
  if (id) { postKey = prefix + sep + id; }
  return postKey;
};

var legacyKeyForPost = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

function Post(data) {
  if (!(this instanceof Post)) {
    return new Post(data);
  }
  // data.id signifies existing post
  if (data.id) { this.id = data.id; }
  if (data.created_at) { this.created_at = data.created_at; }
  if (data.updated_at) { this.updated_at = data.updated_at; }
  if (data.imported_at) { this.imported_at = data.imported_at; }
  if (data.deleted) { this.deleted = data.deleted; }
  if (data.smf && data.smf.post_id) { this.smf  = data.smf; }
  if (data.version) { this.version = data.version; }
  this.thread_id = data.thread_id;
  this.body = data.body;
  this.title = data.title;
  this.user_id = data.user_id;
}

Post.prototype.getKey = function() {
  var self = this;
  return keyForPost(self.id);
};

Post.prototype.getThreadPostKey = function() {
  var key;
  if (this.thread_id && this.id) {
    key = indexPrefix + sep + this.thread_id + sep + this.id;
  }
  return key;
};

Post.prototype.getLegacyKey = function() {
  var self = this;
  return legacyKeyForPost(self.smf.post_id);
};

Post.prototype.getThreadKey = function() {
  var key;
  if (this.thread_id) {
    key = config.threads.prefix + sep + this.thread_id;
  }
  return key;
};

Post.prototype.versionKey = function() {
  var key;
  if (this.id) {
    key = config.posts.version + sep + this.id + sep + this.version;
  }

  return key;
};

Post.prototype.validate = function() {
  var post = this.simple();
  return schema.validate(post);
};

Post.prototype.simple = function() {
  var post = {};
  var self = this;
  if (self.id) { post.id = self.id; }
  if (self.title) { post.title = self.title; }
  if (self.body) { post.body = self.body; }
  if (self.user_id) { post.user_id = self.user_id; }
  if (self.thread_id) { post.thread_id = self.thread_id; }
  if (self.created_at) { post.created_at = self.created_at; }
  if (self.updated_at) { post.updated_at = self.updated_at; }
  if (self.imported_at) { post.imported_at = self.imported_at; }
  if (self.deleted) { post.deleted = self.deleted; }
  if (self.smf && self.smf.post_id) { post.smf  = self.smf; }
  if (self.version) { post.version = self.version; }
  return post;
};

Post.getKeyFromId = function(id) {
  return keyForPost(id);
};

Post.getLegacyKeyFromId = function(legacyId) {
  return legacyKeyForPost(legacyId);
};

Post.prefix = prefix;
