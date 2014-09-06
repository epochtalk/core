var boards = {};
module.exports = boards;

var path = require('path');
var db = require(path.join(__dirname, 'db'));
var Board = require(path.join(__dirname, 'model'));

boards.import = function(json) {
  var importBoard = new Board(json);

  return importBoard.validate()
  .then(function() {
    return db.import(importBoard);
  })
  .then(function(board) {
    return board.simple();
  });
};

boards.create = function(json) {
  var newBoard = new Board(json);

  return newBoard.validate()
  .then(function() {
    return db.create(newBoard);
  })
  .then(function(board) {
    return board.simple();
  });
};

boards.find = function(id) {
  return db.find(id)
  .then(function(board) {
    return board.simple();
  });
};

boards.update = function(json) {
  var updateBoard = new Board(json);

  return updateBoard.validate()
  .then(function() {
    return db.update(updateBoard);
  })
  .then(function(board) {
    return board.simple();
  });
};

boards.delete = function(id) {
  return db.delete(id)
  .then(function(board) {
    return board.simple();
  });
};

boards.purge = function(id) {
  return db.purge(id)
  .then(function(board) {
    return board.simple();
  });
};

boards.boardByOldId = function(oldId) {
  return db.boardByOldId(oldId)
  .then(function(board) {
    return board.simple();
  });
};

boards.all = function() {
  return db.all(); // all already simple
};
