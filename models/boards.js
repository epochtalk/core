var _ = require('lodash');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));

var keyForBoard = function(id) {
  return config.boards.prefix + config.sep + id;
}

function Board(data) {
  // to base model
  var timestamp = Date.now();
  this.created_at = timestamp;
  this.updated_at = timestamp;
  this.id = timestamp + uuid.v1({ msecs: timestamp });
  // specific to board
  this.name = data.name;
  this.description = data.description;
  this.parent_id = data.parent_id;
  this.children_ids = data.children_ids;
}

Board.prototype.getKey = function() {
  var self = this;
  return keyForBoard(self.id);
};

// children in database stored in relation to board index
Board.prototype.getChildren = function() {
  var self = this;
  return Promise.all(self.children_ids.map(function(childId) {
    return db.content.getAsync(childId)
    .then(function(childBoardData) {
      return new Board(childBoardData);
    });
  }));
};

// parent defined in actual board stored object
Board.prototype.getParent = function() {
  var self = this;
  return db.content.getAsync(self.parent_id)
  .then(function(parentBoardData) {
    return new Board(parentBoardData);
  });
};

// 1. get all boards period (childboards along with parent boards)
// 2. boards with children_ids are parent boards
// 3. parent_ids for going back to parent from child board

var board = new Board({name: 'Board 1', description: 'Board 1 Description'});
console.log(board);
