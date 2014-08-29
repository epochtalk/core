module.exports = Board;
var Promise = require('bluebird');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var schema = require(path.join(__dirname, 'schema'));
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
  if (board.smf && board.smf.board_id) { this.smf  = board.smf; }
  if (board.parent_id) { this.parent_id = board.parent_id; }
  if (board.children_ids) { this.children_ids = board.children_ids; }
}

Board.prototype.key = function() {
  var self = this;
  return keyForBoard(self.id);
};

Board.prototype.legacyKey = function() {
  var self = this;
  var legacyKey;
  if (self.smf.board_id) {
    legacyKey = legacyKeyForBoard(self.smf.board_id);
  }
  return legacyKey;
};

// children in database stored in relation to board index
Board.prototype.getChildren = function() {
  var self = this;

  if (!self.children_ids) { return Promise.resolve([]); }

  return Promise.all(self.children_ids.map(function(childId) {
    var board;
    var boardKeyPrefix = config.boards.prefix + config.sep + childId + config.sep;
    var boardPostCountKey = boardKeyPrefix + 'post_count';
    var boardThreadCountKey = boardKeyPrefix + 'thread_count';
    return db.content.getAsync(keyForBoard(childId))
    .then(function(childBoardData) {
      board = new Board(childBoardData);
      return db.metadata.getAsync(boardPostCountKey);
    })
    .then(function(postCount) {
      board.post_count = Number(postCount);
      return db.metadata.getAsync(boardThreadCountKey);
    })
    .then(function(threadCount) {
      board.thread_count = Number(threadCount);
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
  if (self.smf && self.smf.board_id) { board.smf = self.smf; }
  // this is a generated property
  if (self.children) { board.children = self.children; }
  if (self.post_count) { board.post_count = self.post_count; }
  if (self.thread_count) { board.thread_count = self.thread_count; }

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

Board.legacyKeyFromId = function(legacyId) {
  return legacyKeyForBoard(legacyId);
};

Board.prefix = prefix;
