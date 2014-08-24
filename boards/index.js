var boards = {};
module.exports = boards;

var path = require('path');
var db = require(path.join(__dirname, 'db'));
var Board = require(path.join(__dirname, 'model'));

boards.import = function(json) {
  var board = new Board(json);

  // validation
  return board.validate()
  // import into db
  .then(function() {
    return db.import(board);
  })
  // return json version of board
  .then(function() {
    return board.simple();
  });
};

boards.create = function(json) {
  var board = new Board(json);

  return board.validate()
  .then(function() {
    return db.create(board);
  })
  .then(function() {
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
  var board = new Board(json);

  return board.validate()
  .then(function() {
    return db.update(board);
  })
  .then(function() {
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
  return db.all()
  .then(function(allboards) {
    return allboards;
  });
};
