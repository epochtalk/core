module.exports = Board;
var Promise = require('bluebird');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var schema = require(path.join(__dirname, 'schema'));
var boardsDb = require(path.join(__dirname, 'db'));
var db = require(path.join(__dirname, '..', 'db'));
var prefix = config.boards.prefix;
var sep = config.sep;

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
  if (board.deleted) { this.deleted = board.deleted; }
  // specific to board
  this.name = board.name;
  if (board.description) { this.description = board.description; }
  if (board.smf && board.smf.ID_BOARD) { this.smf  = board.smf; }
  if (board.parent_id) { this.parent_id = board.parent_id; }
  if (board.children_ids) { this.children_ids = board.children_ids; }
}

Board.prototype.key = function() {
  var self = this;
  return keyForBoard(self.id);
};

Board.prototype.legacyKey = function() {
  var self = this;
  return legacyKeyForBoard(self.smf.ID_BOARD);
};

// children in database stored in relation to board index
Board.prototype.getChildren = function() {
  var self = this;

  if (!self.children_ids) { return Promise.resolve([]); }

  return Promise.all(self.children_ids.map(function(childId) {
    var boardKeyPrefix = config.boards.prefix + config.sep + childId + config.sep;
    var boardPostCountKey = boardKeyPrefix + 'post_count';
    var boardThreadCountKey = boardKeyPrefix + 'thread_count';
    return boardsDb.find(childId)
    .then(function(board) {
      return board;
    });
  }));
};

// parent defined in actual board stored object
Board.prototype.getParent = function() {
  var self = this;

  if (!this.parent_id) { return Promise.reject('No Parent Id Found'); }

  return db.content.getAsync(keyForBoard(self.parent_id))
  .then(function(parentBoardData) {
    return new Board(parentBoardData);
  });
};

Board.prototype.validate = function() {
  var board = this.simple();

  // input validation
  return schema.validate(board); // blocking
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
  if (self.parent_id) { board.parent_id = self.parent_id; }
  if (self.children_ids) { board.children_ids = self.children_ids; }
  if (self.deleted) { board.deleted = self.deleted; }
  if (self.smf && self.smf.ID_BOARD) { board.smf = self.smf; }
  // this is a generated property
  if (self.children) { board.children = self.children; }
  if (self.post_count) { board.post_count = self.post_count; }
  if (self.thread_count) { board.thread_count = self.thread_count; }
  if (self.last_post_username) { board.last_post_username = self.last_post_username; }
  if (self.last_post_created_at) { board.last_post_created_at = self.last_post_created_at; }
  if (self.last_thread_title) { board.last_thread_title = self.last_thread_title; }

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

Board.lastPostUsernameKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'last_post_username';
};

Board.lastPostCreatedAtKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'last_post_created_at';
};

Board.lastThreadTitleKeyFromId = function(id) {
  return keyForBoard(id) + config.sep + 'last_thread_title';
};

Board.legacyKeyFromId = function(legacyId) {
  return legacyKeyForBoard(legacyId);
};

Board.prefix = prefix;
