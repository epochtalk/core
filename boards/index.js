var boards = {};
module.exports = boards;

var Promise = require('bluebird');
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

  return updateBoard.validateUpdate()
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

boards.updateCategories = function(categories) {
  return db.updateCategories(categories)
  .then(function(dbCategories) {
    return dbCategories;
  });
};

boards.allCategories = function() {
  return db.allCategories()
  .then(function(dbCategories) {
    var allCategories = [];
    return Promise.each(dbCategories, function(category) {
      category.boards = category.board_ids.slice(0);
      return Promise.map(category.boards, function(boardId) {
        return boards.find(boardId);
      })
      .then(function(boardsArr) {
        category.boards = boardsArr;
        return allCategories.push(category);
      });
    })
    .then(function() {
     return allCategories;
    });
  });
};