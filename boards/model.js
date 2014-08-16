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
  return config.boards.prefix + config.sep + id;
};

var legacyKeyForBoard = function(legacyId) {
  legacyId = legacyId.toString();
  return config.boards.prefix + config.sep + legacyId;
};

// Constructor
function Board(board) {
  // object creation validation
  if (!(this instanceof Board)) {
    return new Board(board);
  }

  // to base model
  this.id = board.id;
  var timestamp = Date.now();
  this.created_at = board.created_at || timestamp;
  this.updated_at = board.updated_at || timestamp;
  this.imported_at = board.imported_at;
  // specific to board
  this.name = board.name;
  this.description = board.description;
  this.smf = board.smf;
  this.parent_id = board.parent_id;
  this.children_ids = board.children_ids || [];
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
  return db.content.getAsync(keyForBoard(self.parent_id))
  .then(function(parentBoardData) {
    return new Board(parentBoardData);
  });
};

Board.prototype.validate = function() {
  var self = this;
  var board = this.toObject();

  // input validation
  var data = null;
  return schema.validate(board); // blocking
};

Board.prototype.toObject = function() {
  var board = {};
  var self = this;

  board.id = self.id;
  board.name = self.name;
  board.description = self.description;
  board.created_at = self.created_at;
  board.updated_at = self.updated_at;
  board.imported_at = self.imported_at;
  board.parent_id = self.parent_id;
  board.children_ids = self.children_ids;
  board.smf = self.smf;
  // this is a generated property
  board.children = self.children;

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
