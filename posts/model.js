module.exports = Post;
var bytewise = require('bytewise');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var validate = require(path.join(__dirname, 'validate'));
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
  if (data.smf && data.smf.ID_MSG) { this.smf  = data.smf; }
  if (data.version) { this.version = data.version; }
  this.thread_id = data.thread_id;
  this.body = data.body;
  this.title = data.title;
  this.user_id = data.user_id;
}

Post.prototype.key = function() {
  var self = this;
  return keyForPost(self.id);
};

Post.prototype.threadPostKey = function() {
  var key;
  if (this.thread_id && this.id) {
    key = indexPrefix + sep + this.thread_id + sep + this.id;
  }
  return key;
};

Post.prototype.threadPostOrderKey = function(count) {
  var key;
  if (this.thread_id && count) {
    var postOrder = encode(count, 'hex');
    key = config.posts.indexPrefix + sep + this.thread_id + sep + postOrder;
  }
  return key;
};

Post.prototype.legacyKey = function() {
  var self = this;
  return legacyKeyForPost(self.smf.ID_MSG);
};

Post.prototype.threadKey = function() {
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

Post.prototype.validateCreate = function() {
  var post = this.simple();
  return validate.create(post);
};

Post.prototype.validateImport = function() {
  var post = this.simple();
  return validate.import(post);
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
  if (self.smf && self.smf.ID_MSG) { post.smf  = self.smf; }
  if (self.version) { post.version = self.version; }
  return post;
};

Post.keyFromId = function(id) {
  return keyForPost(id);
};

Post.usernameKeyFromId = function(id) {
  return keyForPost(id) + config.sep + 'username';
};

Post.legacyKeyFromId = function(legacyId) {
  return legacyKeyForPost(legacyId);
};

Post.prototype.postOrderKey = function() {
  var postKey;
  if (this.id) { postKey = prefix + sep + this.id + sep + 'post_order'; }
  return postKey;
};

Post.prefix = prefix;
Post.indexPrefix = indexPrefix;

function encode(value, encoding) {
  return bytewise.encode(value).toString(encoding || 'binary');
}
