var boards = {};
module.exports = boards;

var Promise = require('bluebird');
var path = require('path');
var db = require(path.join(__dirname, 'db'));
var boardsValidator = require('epoch-validator').core.boards;

boards.import = function(json) {
  return boardsValidator.import(json)
  .then(db.import);
};

boards.create = function(json) {
  return boardsValidator.create(json)
  .then(db.create);
};

boards.find = function(id) {
  return boardsValidator.id(id)
  .then(db.find);
};

boards.update = function(json) {
  return boardsValidator.update(json)
  .then(db.update);
};

boards.delete = function(id) {
  return boardsValidator.id(id)
  .then(db.delete);
};

boards.undelete = function(id) {
  return boardsValidator.id(id)
  .then(db.undelete);
};

boards.purge = function(id) {
  return boardsValidator.id(id)
  .then(db.purge);
};

boards.boardByOldId = function(oldId) {
  return boardsValidator.numId(oldId)
  .then(db.boardByOldId);
};

boards.all = function() {
  return db.all();
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
