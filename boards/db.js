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
  var boardVersionKey = board.getNewVersionKey();
  // batch?
  return db.content.putAsync(boardKey, board.toObject())
  .then(function() {
    return db.content.putAsync(boardVersionKey, board.toObject());
  })
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
      board.children = children;
    })
    .then(function() {
      return board;
    });
  });
};

/*  UPDATE */
boards.update = function(board) {
  var boardKey = board.getKey();
  var boardVersionKey = board.getNewVersionKey();
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
    return db.content.putAsync(boardKey, updateBoard.toObject());
  })
  .then(function() {
    return db.content.putAsync(boardVersionKey, updateBoard.toObject());
  })
  .then(function() { return updateBoard; });
};

/* DELETE */
boards.delete = function(boardId) {
  var boardKey = Board.getKeyFromId(boardId);
  var boardVersionKey = Board.getNewVersionKeyFromId(boardId);
  var deleteBoard = null;

  // see if board already exists
  return db.content.getAsync(boardKey)
  .then(function(boardData) {
    deleteBoard = new Board(boardData);

    // add deleted: true flag to board
    deleteBoard.deleted = true;
    deleteBoard.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(boardKey, deleteBoard.toObject());
  })
  .then(function() {
    return db.content.putAsync(boardVersionKey, deleteBoard.toObject());
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
    return purgeBoard.getKey();
  })
  // remove board from content
  .then(function(boardKey) {
    return db.content.delAsync(boardKey);
  })
  // get board versions
  .then(function() {
    return boards.versions(purgeBoard.id);
  })
  // convert each boardVersion into a batch-able put
  .then(function(boardVersions) {
    var batchArray = [];
    return Promise.all(boardVersions.map(function(boardVersion) {
      return {
        type: 'put',
        key: boardVersion.key,
        value: boardVersion.value
      };
    }));
  })
  // add board versions to deleted
  .then(function(batchArray) {
    return db.deleted.batchAsync(batchArray)
    .then(function() { return batchArray; });
  })
  // delete all versioned copy of this board from content
  .then(function(batchArray) {
    batchArray = batchArray.map(function(batchItem) {
      batchItem.type = 'del';
      delete batchItem.value;
      return batchItem;
    });
    return db.content.batch(batchArray);
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
    return db.content.getAsync(boardKey)
    .then(function(board) {
      board = new Board(board);
      board.children = board.getChildren();
      return board;
    });
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
      boardModel.getChildren()
      .then(function(children) {
        boardModel.children = children;
        allBoards.push(boardModel.toObject());
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

/* QUERY: gets all version of a single board.
   RETURNS: array of versions, format: { key, value (as object) }
*/
boards.versions = function(id) {
  return new Promise(function(fulfill, reject) {
    var boardVersions = [];
    var sortBoards = function(board) {
      boardVersions.push(board);
    };
    var handler = function() {
      fulfill(boardVersions);
    };

    var searchKey = config.boards.version + config.sep + id + config.sep;
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
