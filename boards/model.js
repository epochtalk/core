module.exports = Board;
var _ = require('lodash');
var joi = require('joi');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var schema = require(path.join(__dirname, 'schema'));
var helper = require(path.join(__dirname, '..', 'helper'));

// helper functions
var keyForBoard = function(id) {
  var boardKey;
  if (id) { boardKey = config.boards.prefix + config.sep + id; }
  return boardKey;
};

var legacyKeyForBoard = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = config.boards.prefix + config.sep + legacyId;
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
  if (board.children_ids) this.children_ids = board.children_ids;
}

Board.prototype.getKey = function() {
  var self = this;
  return keyForBoard(self.id);
};

Board.prototype.getLegacyKey = function() {
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
    return db.content.getAsync(keyForBoard(childId))
    .then(function(childBoardData) {
      return new Board(childBoardData);
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
  var self = this;
  var board = this.simple();

  // input validation
  var data = null;
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

  return board;
};

// Static Methods
Board.getKeyFromId = function(id) {
  return keyForBoard(id);
};

Board.getLegacyKeyFromId = function(legacyId) {
  return legacyKeyForBoard(legacyId);
};

Board.prefix = config.boards.prefix;
