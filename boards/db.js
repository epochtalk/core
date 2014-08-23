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
  board.imported_at = Date.now();
  return boards.create(board) // create board first to handle id
  .then(function(dbBoard) {
    if (dbBoard.smf) {
      db.legacy.putAsync(board.getLegacyKey(), dbBoard.id)
      .then(function() { return dbBoard; });
    }
  });
};

/* CREATE */
boards.create = function(board) {
  // insert into db
  board.id = helper.genId();
  var timestamp = Date.now();
  if (!board.created_at) { board.created_at = timestamp; }
  board.updated_at = timestamp;
  var boardKey = board.getKey();

  return db.content.putAsync(boardKey, board)
  .then(function() { return board; });
};

/* RETRIEVE */
boards.find = function(id) {
  var boardKey = Board.getKeyFromId(id);
  return db.content.getAsync(boardKey)
  .then(function(board) {
    board = new Board(board);
    return board.getChildren()
    .then(function(children) {
      if (children.length > 0) { board.children = children; }
      return;
    })
    .then(function() { return board; });
  });
};

/*  UPDATE */
boards.update = function(board) {
  var boardKey = board.getKey();
  var updateBoard = null;

  // get old board from db
  return db.content.getAsync(boardKey)
  .then(function(oldBoard) {
    updateBoard = new Board(oldBoard);

    // update board values
    updateBoard.name = board.name;
    updateBoard.description = board.description;
    updateBoard.parent_id = board.parent_id;
    updateBoard.children_ids = board.children_ids;
    updateBoard.deleted = board.deleted;
    updateBoard.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(boardKey, updateBoard);
  })
  .then(function() { return updateBoard; });
};

/* DELETE */
boards.delete = function(boardId) {
  var boardKey = Board.getKeyFromId(boardId);
  var deleteBoard = null;

  // see if board already exists
  return db.content.getAsync(boardKey)
  .then(function(boardData) {
    deleteBoard = new Board(boardData);

    // add deleted: true flag to board
    deleteBoard.deleted = true;
    deleteBoard.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(boardKey, deleteBoard);
  })
  .then(function() { return deleteBoard; });
};

boards.purge = function(id) {
  var boardKey = Board.getKeyFromId(id);
  var purgeBoard = null;

  // see if board already exists
  return db.content.getAsync(boardKey)
  // set board to function scope
  .then(function(boardData) {
    purgeBoard = new Board(boardData);
  })
  // move board to deleted db
  .then(function() {
    return db.content.putAsync(boardKey, purgeBoard);
  })
  // remove board from content
  .then(function() {
    return db.content.delAsync(purgeBoard.getKey());
  })
  // delete any extra indexes/metadata
  .then(function() {
    if (purgeBoard.smf) {
      var legacyKey = purgeBoard.getLegacyKey();
      db.indexes.delAsync(legacyKey)
      .catch(function(err) { console.log(err); });
    }
    return;
  })
  // return this board
  .then(function() { return purgeBoard; });
};

/*  QUERY: board using old id */
boards.boardByOldId = function(oldId) {
  var legacyBoardKey = Board.getLegacyKeyFromId(oldId);

  return db.legacy.getAsync(legacyBoardKey)
  .then(function(boardId) {
    var boardKey = Board.getKeyFromId(boardId);
    return db.content.getAsync(boardKey);
  })
  .then(function(board) {
    board = new Board(board);
    return board.getChildren()
    .then(function(children) {
      if (children.length > 0) { board.children = children; }
      return;
    })
    .then(function() { return board; });
  });
};

/* QUERY: get all boards.
   RETURNS: array of boards as objects
*/
boards.all = function() {
  return new Promise(function(fulfill, reject) {
    var allBoards = [];
    var sortBoards = function(board) {
      var boardModel = new Board(board.value);
      return boardModel.getChildren()
      .then(function(children) {
        if (children.length > 0) {
          boardModel.children = children;
        }
        if (!boardModel.parent_id) {
          allBoards.push(boardModel.toObject());
        }
        return;
      });
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
