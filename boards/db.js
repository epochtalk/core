var boards = {};
module.exports = boards;

var path = require('path');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Board = require(path.join(__dirname, 'model'));
var helper = require(path.join(__dirname, '..', 'helper'));

/* IMPORT */
boards.import = function(board) {
  return boards.create(board) // create board first to handle id
  .then(function(board) {
    if (board.smf) {
      var legacyBoardKey = board.getLegacyKey();
      db.legacy.putAsync(legacyBoardKey, board.id)
      .catch(function(err) { console.log(err); });
    }
  });
};

/* CREATE */
boards.create = function(board) {
  // insert into db
  board.id = helper.genId();
  var boardKey = board.getKey();
  return db.content.putAsync(boardKey, board.toObject())
  .then(function() { return board; });
};

/* RETRIEVE */
boards.find = function(id) {
  var boardKey = Board.getKeyFromId(id);
  return db.content.getAsync(boardKey)
  .then(function(board) {
    board = new Board(board);
    board.children = board.getChildren();
    return board;
  });
};

/*  UPDATE */
boards.update = function(board) {
  // get old board from db
  var boardKey = board.getKey();
  return db.content.getAsync(boardKey)
  .then(function(oldBoard) {
    oldBoard = new Board(oldBoard);

    // update board values
    oldBoard.name = board.name;
    oldBoard.description = board.description;
    oldBoard.parent_id = board.parent_id;
    oldBoard.children_ids = board.children_ids;
    // insert back into db
    return db.content.putAsync(boardKey, board.toObject())
    .then(function() { return oldBoard; });
  });
};

/* DELETE */
boards.delete = function(boardId) {
  var boardKey = Board.getKeyFromId(boardId);
  var board = null;

  // see if board already exists
  return db.content.getAsync(boardKey)
  // set board to function scope
  .then(function(boardData) {
    board = new Board(boardData);
    return board.getKey();
  })
  // remove board from content
  .then(function(boardKey) {
    return db.content.delAsync(boardKey);
  })
  // add board to deleted
  .then(function() {
    return db.deleted.putAsync(boardKey, JSON.stringify(board));
  })
  // delete any extra indexes/metadata
  .then(function() {
    if (board.smf) {
      var legacyKey = board.getLegacyKey();
      db.indexes.delAsync(legacyKey)
      .catch(function(err) { console.log(err); });
    }

    return board;
  });
};

/*  QUERY: board using old id */
boards.boardByOldId = function(oldId) {
  var legacyBoardKey = Board.getLegacyKeyFromId(oldId);

  return db.legacy.getAsync(legacyBoardKey)
  .then(function(boardId) {
    var boardKey = Board.getKeyFromId(boardId);
    return db.content.getAsync(boardKey)
    .then(function(board) {
      board = new Board(board);
      board.children = board.getChildren();
      return board;
    });
  });
};

/* QUERY: get all boards */
boards.all = function() {
  return new Promise(function(fulfill, reject) {
    var allBoards = [];
    var sortBoards = function(board) {
      var boardModel = new Board(board.value);
      boardModel.children = boardModel.getChildren();
      allBoards.push(boardModel.toObject());
    };
    var handler = function() {
      fulfill(allBoards);
    };

    var searchKey = Board.prefix + config.sep;
    var query = {
      start: searchKey,
      end: searchKey + '\xff'
    };
    db.content.createReadStream(query)
    .on('data', sortBoards)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};
