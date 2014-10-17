var boards = {};
var boardsDb;

var path = require('path');
var Promise = require('bluebird');
var boardsDbHandler = require(path.join(__dirname, 'db'));
var Board = require(path.join(__dirname, 'model'));

boards.import = function(json) {
  var importBoard = new Board(json);

  return importBoard.validate()
  .then(function() {
    return boardsDb.import(importBoard);
  })
  .then(function(board) {
    return board.simple();
  });
};

boards.create = function(json) {
  var newBoard = new Board(json);

  return newBoard.validate()
  .then(function() {
    return boardsDb.create(newBoard);
  })
  .then(function(board) {
    return board.simple();
  });
};

boards.find = function(id) {
  return boardsDb.find(id)
  .then(function(board) {
    return board.simple();
  });
};

boards.update = function(json) {
  var updateBoard = new Board(json);

  return updateBoard.validateUpdate()
  .then(function() {
    return boardsDb.update(updateBoard);
  })
  .then(function(board) {
    return board.simple();
  });
};

boards.delete = function(id) {
  return boardsDb.delete(id)
  .then(function(board) {
    return board.simple();
  });
};

boards.purge = function(id) {
  return boardsDb.purge(id)
  .then(function(board) {
    return board.simple();
  });
};

boards.boardByOldId = function(oldId) {
  return boardsDb.boardByOldId(oldId)
  .then(function(board) {
    return board.simple();
  });
};

boards.all = function() {
  return boardsDb.all(); // all already simple
};

boards.updateCategories = function(categories) {
  return boardsDb.updateCategories(categories)
  .then(function(dbCategories) {
    return dbCategories;
  });
};

boards.allCategories = function() {
  return boardsDb.allCategories()
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

module.exports = function(dbParam) {
  boardsDb = boardsDbHandler(dbParam);
  return boards;
};
