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
  self = {};
  // to base model
  var timestamp = Date.now();
  self.created_at = timestamp;
  self.updated_at = timestamp;
  self.id = timestamp + uuid.v1({ msecs: timestamp });
  self.getKey = function() {
    return keyForBoard(self.id);
  };
  // specific to board
  self.name = data.name;
  self.description = data.description;
  self.parent_id = data.parent_id;

  // children in database stored in relation to board index
  self.getChildren = function() {
    return new Promise(function(fulfill, reject) {
      var children = [];
      var query = {
        start: config.boards.indexPrefix + config.sep + self.id,
        end: config.boards.indexPrefix + config.sep + self.id + '\xff'
      };
      var done = function() {
        fulfill(children);
      };
      db.indexes.createValueStream(query)
      .on('data', function(childBoardId) {
        db.content.getAsync(childBoardId)
        .then(function(childBoardData) {
          children.push(new Board(childBoardData));
        });
      })
      .on('error', reject)
      .on('close', done)
      .on('end', done);
    });
  };

  // parent defined in actual board stored object
  self.getParent = function() {
    return db.content.getAsync(self.parent_id)
    .then(function(parentBoardData) {
      return new Board(parentBoardData);
    });
  };

  return self;
}

var board = new Board({name: 'Board 1', description: 'Board 1 Description'});
console.log(board);

