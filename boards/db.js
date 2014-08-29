var boards = {};
module.exports = boards;

var path = require('path');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var Board = require(path.join(__dirname, 'model'));
var helper = require(path.join(__dirname, '..', 'helper'));
var Padlock = require('padlock').Padlock;
var postCountLock = new Padlock();
var threadCountLock = new Padlock();
/* IMPORT */
boards.import = function(board) {
  board.imported_at = Date.now();
  return boards.create(board) // create board first to handle id
  .then(function(dbBoard) {
    if (dbBoard.smf) {
      db.legacy.putAsync(board.legacyKey(), dbBoard.id)
      .then(function() { return dbBoard; });
    }
  });
};

/* CREATE */
boards.create = function(board) {
  // insert into db
  var timestamp = Date.now();
  if (!board.created_at) { board.created_at = timestamp; }
  board.updated_at = timestamp;
  board.id = helper.genId(board.created_at);
  var boardKey = board.key();

  return boards.incPostCount(board.id)
  .then(function() { return boards.incThreadCount(board.id); })
  .then(function() { return db.content.putAsync(boardKey, board); })
  .then(function() { return board; });
};

/* RETRIEVE */
boards.find = function(id) {
  var boardKey = Board.keyFromId(id);
  var boardPostCountKey = boardKey + config.sep + 'post_count';
  var boardThreadCountKey = boardKey + config.sep + 'thread_count';
  var board;
  return db.content.getAsync(boardKey)
  .then(function(dbBoard) {
    board = new Board(dbBoard);
    return board.getChildren();
  })
  .then(function(children) {
    if (children.length > 0) { board.children = children; }
    return db.metadata.getAsync(boardPostCountKey);
  })
  .then(function(postCount) {
    board.post_count = Number(postCount);
    return db.metadata.getAsync(boardThreadCountKey);
  })
  .then(function(threadCount) {
    board.thread_count = Number(threadCount);
    return board;
  });
};

/*  UPDATE */
boards.update = function(board) {
  var boardKey = board.key();
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
  var boardKey = Board.keyFromId(boardId);
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
  var boardKey = Board.keyFromId(id);
  var purgeBoard;

  // see if board already exists
  return db.content.getAsync(boardKey)
  // set board to function scope
  .then(function(boardData) {
    purgeBoard = new Board(boardData);
  })
  // move board to deleted db
  .then(function() {
    return db.deleted.putAsync(boardKey, purgeBoard);
  })
  // remove board from content
  .then(function() {
    return db.content.delAsync(boardKey);
  })
  // delete postCount index
  .then(function() {
    var postCountKey = boardKey + config.sep + 'post_count';
    return db.metadata.delAsync(postCountKey);
  })
  // delete threadCount index
  .then(function() {
    var threadCountKey = boardKey + config.sep + 'thread_count';
    return db.metadata.delAsync(threadCountKey);
  })
  // delete legacy key index
  .then(function() {
    if (purgeBoard.smf) {
      var legacyKey = purgeBoard.legacyKey();
      return db.indexes.delAsync(legacyKey);
    }
    else { return; }
  })
  // return this board
  .then(function() { return purgeBoard; });
};

/*  QUERY: board using old id */
boards.boardByOldId = function(oldId) {
  var legacyBoardKey = Board.legacyKeyFromId(oldId);

  return db.legacy.getAsync(legacyBoardKey)
  .then(function(boardId) {
    return boards.find(boardId);
  });
};

/* QUERY: get all boards.
   RETURNS: array of boards as objects
*/
boards.all = function() {
  return new Promise(function(fulfill, reject) {
    var boardIds = [];

    var handler = function() {
      Promise.map(boardIds, function(boardId) {
        return boards.find(boardId);
      })
      .then(function(allBoards) {
        var boards = [];
        allBoards.forEach(function(board) {
          if (!board.parent_id) {
            boards.push(board);
          }
        });
        return fulfill(boards);
      });
    };

    var searchKey = Board.prefix + config.sep;
    var query = {
      start: searchKey,
      end: searchKey + '\xff'
    };
    db.content.createReadStream(query)
    .on('data', function(board) {
      boardIds.push(board.value.id);
     })
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

boards.incPostCount = function(id) {
  var postCountKey = Board.postCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function () {
      var newPostCount = 0;
      db.metadata.getAsync(postCountKey)
      .then(function(postCount) {
        newPostCount = Number(postCount);
        newPostCount++;
        return newPostCount;
      })
      .catch(function() { return newPostCount; })
      .then(function(postCount) { return db.metadata.putAsync(postCountKey, postCount); })
      .then(function() { fulfill(newPostCount); })
      .catch(function(err) { reject(err); })
      .finally(function() { postCountLock.release(); });
    });
  });
};

boards.decPostCount = function(id) {
  var postCountKey = Board.postCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function () {
      var newPostCount = 0;
      db.metadata.getAsync(postCountKey)
      .then(function(postCount) {
        newPostCount = Number(postCount);
        if (newPostCount > 0) {
          newPostCount--;
        }
        return newPostCount;
      })
      .catch(function() { return newPostCount; })
      .then(function(postCount) { return db.metadata.putAsync(postCountKey, postCount); })
      .then(function() { fulfill(newPostCount); })
      .catch(function(err) { reject(err); })
      .finally(function() { postCountLock.release(); });
    });
  });
};

boards.incThreadCount = function(id) {
  var threadCountKey = Board.threadCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    threadCountLock.runwithlock(function () {
      var newThreadCount = 0;
      db.metadata.getAsync(threadCountKey)
      .then(function(threadCount) {
        newThreadCount = Number(threadCount);
        newThreadCount++;
        return newThreadCount;
      })
      .catch(function() { return newThreadCount; })
      .then(function(count) { return db.metadata.putAsync(threadCountKey, count);})
      .then(function() { fulfill(newThreadCount); })
      .catch(function(err) { reject(err); })
      .finally(function() { threadCountLock.release(); });
    });
  });
};

boards.decThreadCount = function(id) {
  var threadCountKey = Board.threadCountKeyFromId(id);
  return new Promise(function(fulfill, reject) {
    threadCountLock.runwithlock(function () {
      var newThreadCount = 0;
      db.metadata.getAsync(threadCountKey)
      .then(function(threadCount) {
        newThreadCount = Number(threadCount);
        if (newThreadCount > 0) {
          newThreadCount--;
        }
        return newThreadCount;
      })
      .catch(function() { return newThreadCount; })
      .then(function(count) { return db.metadata.putAsync(threadCountKey, count);})
      .then(function() { fulfill(newThreadCount); })
      .catch(function(err) { reject(err); })
      .finally(function() { threadCountLock.release(); });
    });
  });
};