var boards = {};
module.exports = boards;

var Promise = require('bluebird');
var path = require('path');
var db = require(path.join(__dirname, 'db'));
var schema = require(path.join(__dirname, 'schema'));

boards.import = function(data) {
  return schema.validate(data)
  .then(function() {
    return db.import(data);
  });
};

boards.create = function(json) {
  return schema.validate(json)
  .then(function() {
    return db.create(json);
  });
};

boards.find = function(id) {
  return db.find(id);
};

boards.update = function(json) {
  return schema.validateUpdate(json)
  .then(function() {
    return db.update(json);
  });
};

boards.delete = function(id) {
  return db.delete(id);
};

boards.undelete = function(id) {
  return db.undelete(id);
};

boards.purge = function(id) {
  return db.purge(id);
};

boards.boardByOldId = function(oldId) {
  return db.boardByOldId(oldId);
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
