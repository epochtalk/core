module.exports = Thread;
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var schema = require(path.join(__dirname, 'schema'));
var indexPrefix = config.threads.indexPrefix;
var prefix = config.threads.prefix;
var sep = config.sep;

// helper functions
var keyForThread = function(id) {
  var threadKey;
  if (id) { threadKey = prefix + sep + id; }
  return threadKey;
};

var legacyKeyForThread = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

function Thread(data) {
  if (!(this instanceof Thread)) {
    return new Thread(data);
  }
  // data.id signifies existing thread
  if (data.id) { this.id = data.id; }
  if (data.created_at) { this.created_at = data.created_at; }
  if (data.imported_at) { this.imported_at = data.imported_at; }
  if (data.deleted) { this.deleted = data.deleted; }
  if (data.smf && data.smf.ID_TOPIC) { this.smf  = data.smf; }
  this.board_id = data.board_id;
}

Thread.prototype.key = function() {
  return keyForThread(this.id);
};

Thread.prototype.legacyKey = function() {
  return legacyKeyForThread(this.smf.ID_TOPIC);
};

Thread.prototype.boardThreadKey = function(timestamp) {
  var boardThreadKey;
  if (this.id && this.board_id) {
    boardThreadKey = indexPrefix + sep + this.board_id + sep + timestamp + sep + this.id;
  }
  return boardThreadKey;
};

Thread.prototype.boardKey = function() {
  var key;
  if (this.id) {
    key = config.boards.prefix + config.sep + this.board_id;
  }
  return key;
};

Thread.prototype.validate = function() {
  var thread = this.simple();
  return schema.validate(thread);
};

Thread.prototype.simple = function() {
  var thread = {};
  var self = this;
  if (self.id) { thread.id = self.id; }
  if (self.board_id) { thread.board_id = self.board_id; }
  if (self.created_at) { thread.created_at = self.created_at; }
  if (self.imported_at) { thread.imported_at = self.imported_at; }
  if (self.deleted) { thread.deleted = self.deleted; }
  if (self.smf && self.smf.ID_TOPIC) { thread.smf  = self.smf; }
  // this is a generated property
  if (self.last_post_username) { thread.last_post_username = self.last_post_username; }
  if (self.last_post_created_at) { thread.last_post_created_at = self.last_post_created_at; }
  if (self.view_count) { thread.view_count = self.view_count; }
  if (self.post_count) { thread.post_count = self.post_count; }
  if (self.first_post_id) { thread.first_post_id = self.first_post_id; }
  if (self.user) { thread.user = self.user; }
  return thread;
};

Thread.keyFromId = function(id) {
  return keyForThread(id);
};

Thread.legacyKeyFromId = function(legacyId) {
  return legacyKeyForThread(legacyId);
};

Thread.postCountKeyFromId = function(id) {
  return keyForThread(id) + config.sep + 'post_count';
};

Thread.firstPostIdKeyFromId = function(id) {
  return keyForThread(id) + config.sep + 'first_post_id';
};

Thread.titleKeyFromId = function(id) {
  return keyForThread(id) + config.sep + 'title';
};

Thread.usernameKeyFromId = function(id) {
  return keyForThread(id) + config.sep + 'username';
};

Thread.lastPostUsernameKeyFromId = function(id) {
  return keyForThread(id) + config.sep + 'last_post_username';
};

Thread.lastPostCreatedAtKeyFromId = function(id) {
  return keyForThread(id) + config.sep + 'last_post_created_at';
};

Thread.viewCountKeyFromId = function(id) {
  return keyForThread(id) + config.sep + 'view_count';
};

Thread.prefix = prefix;

