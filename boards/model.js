module.exports = Board;
var _ = require('lodash');
var joi = require('joi');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));

// validation 
var validate = Promise.promisify(joi.validate);
var boardSchema = joi.object().keys({
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  id: joi.string(),
  name: joi.string().required(),
  description: joi.string(),
  parent_id: joi.string(),
  children_ids: joi.array(joi.string()),
  smf: {
    board_id: joi.number()
  }
});

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

  // input validation
  var data = null;
  var validData = validate(board, boardSchema); // blocking
  if (validData.isFulfilled()) { data = validData.value(); }
  else {
    // catch the error first so it doesn't propagate
    validData.catch(function(err) {});
    // assign error and return
    this.error = validData.reason();
    return;
  }

  // to base model
  var timestamp = Date.now();
  this.created_at = data.created_at || timestamp;
  this.updated_at = data.updated_at || timestamp;
  this.id = data.id || timestamp + uuid.v1({ msecs: timestamp });
  // specific to board
  this.name = data.name;
  this.description = data.description;
  this.smf = data.smf;
  this.parent_id = data.parent_id;
  this.children_ids = data.children_ids || [];
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

// Static Methods
Board.getKeyFromId = function(id) {
  return keyForBoard(id);
};

Board.getLegacyKeyFromId = function(legacyId) {
  return legacyKeyForBoard(legacyId);
};

Board.prefix = config.boards.prefix;
