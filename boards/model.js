module.exports = Board;
var Promise = require('bluebird');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var schema = require(path.join(__dirname, 'schema'));
var prefix = config.boards.prefix;
var catPrefix = config.boards.categoryPrefix;
var sep = config.sep;
var emptyArray = [];
Board.prefix = prefix;

// helper functions
var keyForBoard = function(id) {
  var boardKey;
  if (id) { boardKey = prefix + sep + id; }
  return boardKey;
};

var legacyKeyForBoard = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

// Constructor
function Board(board) {
  // object creation validation
  if (!(this instanceof Board)) {
    return new Board(board);
  }

  // to base model
  if (board.id) { this.id = board.id; }
  if (board.created_at) { this.created_at = board.created_at; }
  if (board.updated_at) { this.updated_at = board.updated_at; }
  if (board.imported_at) { this.imported_at = board.imported_at; }
  if (board.deleted || board.deleted === null) { this.deleted = board.deleted; }
  if (board.smf && board.smf.ID_BOARD) { this.smf  = board.smf; }
  // specific to board
  this.name = board.name;
  if (board.description || board.description === null) {
    this.description = board.description;
  }
  if (board.category_id || board.category_id === null) {
    this.category_id = board.category_id;
  }
  if (board.parent_id || board.parent_id === null) {
    this.parent_id = board.parent_id;
  }
  if (board.children_ids || board.children_ids === null) {
    this.children_ids = board.children_ids;
  }
}

Board.prototype.key = function() {
  return keyForBoard(this.id);
};

Board.prototype.legacyKey = function() {
  return legacyKeyForBoard(this.smf.ID_BOARD);
};

Board.prototype.categoryKey = function() {
  return catPrefix + sep + this.category_id;
};

Board.prototype.validate = function() {
  var board = this.simple();
  return schema.validate(board);
};

Board.prototype.validateUpdate = function() {
  var board = this.simple();
  return schema.validateUpdate(board);
};

Board.prototype.simple = function() {
  var board = {};
  var self = this;

  if (self.id) { board.id = self.id; }
  board.name = self.name;
  if (self.description) { board.description = self.description; }
  if (self.created_at) { board.created_at = self.created_at; }
  if (self.updated_at) { board.updated_at = self.updated_at; }
  if (self.imported_at) { board.imported_at = self.imported_at; }
  if (self.deleted) { board.deleted = self.deleted; }
  if (self.smf && self.smf.ID_BOARD) { board.smf = self.smf; }
  // this is a generated property
  if (self.category_id) { board.category_id = self.category_id; }
  if (self.parent_id) { board.parent_id = self.parent_id; }
  if (self.children) { board.children = self.children; }
  if (self.children_ids) { board.children_ids = self.children_ids; }
  if (self.post_count) { board.post_count = self.post_count; }
  if (self.thread_count) { board.thread_count = self.thread_count; }
  if (self.total_post_count) { board.total_post_count = self.total_post_count; }
  if (self.total_thread_count) { board.total_thread_count = self.total_thread_count; }
  if (self.last_post_username) { board.last_post_username = self.last_post_username; }
  if (self.last_post_created_at) { board.last_post_created_at = self.last_post_created_at; }
  if (self.last_thread_title) { board.last_thread_title = self.last_thread_title; }
  if (self.last_thread_id) { board.last_thread_id = self.last_thread_id; }

  return board;
};

// Static Methods
Board.keyFromId = function(id) {
  return keyForBoard(id);
};

Board.postCountKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'post_count';
};

Board.threadCountKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'thread_count';
};

Board.totalPostCountKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'total_post_count';
};

Board.totalThreadCountKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'total_thread_count';
};

Board.lastPostUsernameKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'last_post_username';
};

Board.lastPostCreatedAtKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'last_post_created_at';
};

Board.lastThreadTitleKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'last_thread_title';
};

Board.lastThreadIdKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'last_thread_id';
};

Board.legacyKeyFromId = function(legacyId) {
  return legacyKeyForBoard(legacyId);
};
