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
  if (data.updated_at) { this.updated_at = data.updated_at; }
  if (data.imported_at) { this.imported_at = data.imported_at; }
  if (data.deleted) { this.deleted = data.deleted; }
  if (data.smf && data.smf.thread_id) { this.smf  = data.smf; }
  this.board_id = data.board_id;
}

Thread.prototype.getKey = function() {
  var self = this;
  return keyForThread(self.id);
};

Thread.prototype.getPostCountKey = function() {
  var key;
  if (this.id) {
    key = prefix + sep + this.id + sep + 'post_count';
  }
  return key;
};

Thread.prototype.getLegacyKey = function() {
  var self = this;
  return legacyKeyForThread(self.smf.thread_id);
};

Thread.prototype.getBoardThreadKey = function() {
  var boardThreadKey;
  if (this.id && this.board_id) {
    boardThreadKey = indexPrefix + sep + this.board_id + sep + this.id;
  }
  return boardThreadKey;
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
  if (self.updated_at) { thread.updated_at = self.updated_at; }
  if (self.imported_at) { thread.imported_at = self.imported_at; }
  if (self.deleted) { thread.deleted = self.deleted; }
  if (self.smf && self.smf.thread_id) { thread.smf  = self.smf; }
  // this is a generated property
  return thread;
};

Thread.getKeyFromId = function(id) {
  return keyForThread(id);
};

Thread.getLegacyKeyFromId = function(legacyId) {
  return legacyKeyForThread(legacyId);
};

Thread.prefix = prefix;