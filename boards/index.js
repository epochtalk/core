var boards = {};
module.exports = boards;

var Promise = require('bluebird');
var path = require('path');
var db = require(path.join(__dirname, 'db'));
var schema = require(path.join(__dirname, 'schema'));

boards.import = function(json) {
  return schema.validateImport(json)
  .then(db.import);
};

boards.create = function(json) {
  return schema.validateCreate(json)
  .then(db.create);
};

boards.find = function(id) {
  return schema.validateId(id)
  .then(db.find);
};

boards.update = function(json) {
  return schema.validateUpdate(json)
  .then(db.update);
};

boards.delete = function(id) {
  return schema.validateId(id)
  .then(db.delete);
};

boards.undelete = function(id) {
  return schema.validateId(id)
  .then(db.undelete);
};

boards.purge = function(id) {
  return schema.validateId(id)
  .then(db.purge);
};

boards.boardByOldId = function(oldId) {
  return schema.validateNumId(oldId)
  .then(db.boardByOldId);
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
