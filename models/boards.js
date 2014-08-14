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
  created_at: joi.date(),
  updated_at: joi.date(),
  imported_at: joi.date(),
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
  if (!(this instanceof Board)) {
    return new Board(board);
  }
  // input validation
  var data = null;

  var validData = validate(board, boardSchema); // blocking
  if (validData.isFulfilled()) { data = validData.value(); }
  else { throw new Error(validData.reason()); }
  // to base model
  var timestamp = Date.now();
  // TODO: Joi validation is converting timestamps to dates.
  this.created_at = data.created_at ? data.created_at.getTime() : timestamp;
  this.updated_at = data.updated_at ? data.updated_at.getTime() : timestamp;
  this.id = data.id ? data.id : timestamp + uuid.v1({ msecs: timestamp });
  // specific to board
  this.name = data.name;
  this.description = data.description;
  if (data.parent_id) {
    this.parent_id = data.parent_id;
  }
  if (data.children_ids) {
    this.children_ids = data.children_ids;
  }
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

// 1. get all boards period (childboards along with parent boards)
// 2. boards with children_ids are parent boards
// 3. parent_ids for going back to parent from child board

// var board = new Board({name: 'Board 1', description: 'Board 1 Description'});
// console.log(board);
