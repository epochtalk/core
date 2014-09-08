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
      return db.legacy.putAsync(board.legacyKey(), dbBoard.id)
      .then(function() { return dbBoard; });
    }
  });
};

/* CREATE */
boards.create = function(board) {
  // insert into db
  var timestamp = Date.now();
  if (!board.created_at) {
    board.created_at = timestamp;
    board.updated_at = timestamp;
  }
  else if (!board.updated_at) {
    board.updated_at = board.created_at;
  }
  board.updated_at = timestamp;
  board.id = helper.genId(board.created_at);
  var boardKey = board.key();
  var boardLastPostUsernameKey = Board.lastPostUsernameKeyFromId(board.id);
  var boardLastPostCreatedAtKey = Board.lastPostCreatedAtKeyFromId(board.id);
  var boardLastThreadTitleKey = Board.lastThreadTitleKeyFromId(board.id);
  var boardLastThreadIdKey = Board.lastThreadIdKeyFromId(board.id);
  var totalPostCountKey = Board.totalPostCountKeyFromId(board.id);
  var totalThreadCountKey = Board.totalThreadCountKeyFromId(board.id);
  var postCountKey = Board.postCountKeyFromId(board.id);
  var threadCountKey = Board.threadCountKeyFromId(board.id);
  
  var metadataBatch = [
    // TODO: There should be a better solution than initializing with strings
    { type: 'put', key: boardLastPostUsernameKey , value: 'none' },
    { type: 'put', key: boardLastPostCreatedAtKey , value: 'none' },
    { type: 'put', key: boardLastThreadTitleKey , value: 'none' },
    { type: 'put', key: boardLastThreadIdKey , value: 'none' },
    { type: 'put', key: totalPostCountKey , value: 0 },
    { type: 'put', key: totalThreadCountKey , value: 0 },
    { type: 'put', key: postCountKey , value: 0 },
    { type: 'put', key: threadCountKey , value: 0 }
  ];
  return db.metadata.batchAsync(metadataBatch)
  .then(function() { return db.content.putAsync(boardKey, board); })
  .then(function() { return board; });
};

/* RETRIEVE */
boards.find = function(id) {
  var boardKey = Board.keyFromId(id);
  var postCountKey = Board.postCountKeyFromId(id);
  var threadCountKey = Board.threadCountKeyFromId(id);
  var totalPostCountKey = Board.totalPostCountKeyFromId(id);
  var totalThreadCountKey = Board.totalThreadCountKeyFromId(id);
  var lastPostUsernameKey = Board.lastPostUsernameKeyFromId(id);
  var lastPostCreatedAtKey = Board.lastPostCreatedAtKeyFromId(id);
  var lastThreadTitleKey = Board.lastThreadTitleKeyFromId(id);
  var lastThreadIdKey = Board.lastThreadIdKeyFromId(id);
  var board;
  return db.content.getAsync(boardKey)
  .then(function(dbBoard) {
    board = new Board(dbBoard);
    board.post_count = 0;
    board.thread_count = 0;
    return board.getChildren();
  })
  .then(function(children) {
    if (children.length > 0) {
      board.children = children;
    }
    return db.metadata.getAsync(postCountKey);
  })
  .then(function(postCount) {
    board.post_count += Number(postCount);
    return db.metadata.getAsync(threadCountKey);
  })
  .then(function(threadCount) {
    board.thread_count += Number(threadCount);
    return db.metadata.getAsync(totalPostCountKey);
  })
  .then(function(totalPostCount) {
    board.total_post_count = Number(totalPostCount);
    return db.metadata.getAsync(totalThreadCountKey);
  })
  .then(function(totalThreadCount) {
    board.total_thread_count = Number(totalThreadCount);
    return db.metadata.getAsync(lastPostUsernameKey);
  })
  .then(function(username) {
    board.last_post_username = username;
    return db.metadata.getAsync(lastPostCreatedAtKey);
  })
  .then(function(created) {
    board.last_post_created_at = created;
    return db.metadata.getAsync(lastThreadTitleKey);
  })
  .then(function(threadTitle) {
    board.last_thread_title = threadTitle;
    return db.metadata.getAsync(lastThreadIdKey);
  })
  .then(function(threadId) {
    board.last_thread_id = threadId;
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
    if (board.name) { updateBoard.name = board.name; }
    if (board.description) { updateBoard.description = board.description; }
    if (board.updateBoard) { updateBoard.parent_id = board.parent_id; }
    if (board.children_ids) { updateBoard.children_ids = board.children_ids; }
    if (board.deleted) { updateBoard.deleted = board.deleted; }
    else { delete updateBoard.deleted; }
    updateBoard.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(boardKey, updateBoard);
  })
  .then(function() { return updateBoard; });
};

/* DELETE */
boards.delete = function(boardId) {
  var boardKey = Board.keyFromId(boardId);
  var deleteBoard;

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
  var postCountKey = Board.postCountKeyFromId(id);
  var threadCountKey = Board.threadCountKeyFromId(id);
  var totalPostCountKey = Board.totalPostCountKeyFromId(id);
  var totalThreadCountKey = Board.totalThreadCountKeyFromId(id);
  var lastPostUsernameKey = Board.lastPostUsernameKeyFromId(id);
  var lastPostCreatedAtKey = Board.lastPostCreatedAtKeyFromId(id);
  var lastThreadTitleKey = Board.lastThreadTitleKeyFromId(id);
  var lastThreadIdKey = Board.lastThreadIdKeyFromId(id);
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
  // delete postCount metadata
  .then(function() {
    return db.metadata.delAsync(postCountKey);
  })
  // delete threadCount metadata
  .then(function() {
    return db.metadata.delAsync(threadCountKey);
  })
  // delete totalPostCount metadata
  .then(function() {
    return db.metadata.delAsync(totalPostCountKey);
  })
  // delete totalThreadCount metadata
  .then(function() {
    return db.metadata.delAsync(totalThreadCountKey);
  })
  // delete lastPostUsername metadata
  .then(function() {
    return db.metadata.delAsync(lastPostUsernameKey);
  })
  // delete lastPostCreatedAt metadata
  .then(function() {
    return db.metadata.delAsync(lastPostCreatedAtKey);
  })
  // delete lastThreadTitle metadata
  .then(function() {
    return db.metadata.delAsync(lastThreadTitleKey);
  })
  // delete lastThreadId metadata
  .then(function() {
    return db.metadata.delAsync(lastThreadIdKey);
  })
  // delete legacy key index
  .then(function() {
    if (purgeBoard.smf) {
      var legacyKey = purgeBoard.legacyKey();
      return db.legacy.delAsync(legacyKey);
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
            boards.push(board.simple());
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


boards.incTotalPostCount = function(id) {
  var count;
  var totalPostCountKey = Board.totalPostCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      increment(totalPostCountKey, postCountLock, promise);
    });
  })
  .then(function(dbCount) { count = dbCount; })
  .then(function() { return boards.find(id); })
  .then(function(board) { return board.parent_id; })
  .then(function(parentId) {
    if (parentId && count > 0) {
      return boards.incTotalPostCount(parentId)
      .then(function() { return count; });
    }
    else { return count; }
  });
};

boards.decTotalPostCount = function(id) {
  var count;
  var totalPostCountKey = Board.totalPostCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      decrement(totalPostCountKey, postCountLock, promise);
    });
  })
  .then(function(dbCount) { count = dbCount; })
  .then(function() { return boards.find(id); })
  .then(function(board) { return board.parent_id; })
  .then(function(parentId) {
    if (parentId && count > 0) {
      return boards.decTotalPostCount(parentId)
      .then(function() { return count; });
    }
    else { return count; }
  });
};

boards.incTotalThreadCount = function(id) {
  var count;
  var totalThreadCountKey = Board.totalThreadCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    threadCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      increment(totalThreadCountKey, threadCountLock, promise);
    });
  })
  .then(function(dbCount) { count = dbCount; })
  .then(function() { return boards.find(id); })
  .then(function(board) { return board.parent_id; })
  .then(function(parentId) {
    if (parentId && count > 0) {
      return boards.incTotalThreadCount(parentId)
      .then(function() { return count; });
    }
    else { return count; }
  });
};

boards.decTotalThreadCount = function(id) {
  var count;
  var totalThreadCountKey = Board.postCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    threadCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      decrement(totalThreadCountKey, threadCountLock, promise);
    });
  })
  .then(function(dbCount) { count = dbCount; })
  .then(function() { return boards.find(id); })
  .then(function(board) { return board.parent_id; })
  .then(function(parentId) {
    if (parentId && count > 0) {
      return boards.decTotalThreadCount(parentId)
      .then(function() { return count; });
    }
    else { return count; }
  });
};

boards.incPostCount = function(id) {
  var postCountKey = Board.postCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      increment(postCountKey, postCountLock, promise);
    });
  })
  .then(function(count) {
    return boards.incTotalPostCount(id)
    .then(function() { return count; });
  });
};

boards.decPostCount = function(id) {
  var postCountKey = Board.postCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    postCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      decrement(postCountKey, postCountLock, promise);
    });
  })
  .then(function(count) {
    return boards.decTotalPostCount(id)
    .then(function() { return count; });
  });
};

boards.incThreadCount = function(id) {
  var threadCountKey = Board.threadCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    threadCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      increment(threadCountKey, threadCountLock, promise);
    });
  })
  .then(function(count) {
    return boards.incTotalThreadCount(id)
    .then(function() { return count; });
  });
};

boards.decThreadCount = function(id) {
  var threadCountKey = Board.threadCountKeyFromId(id);

  return new Promise(function(fulfill, reject) {
    threadCountLock.runwithlock(function () {
      var promise = { fulfill: fulfill, reject: reject };
      decrement(threadCountKey, threadCountLock, promise);
    });
  })
  .then(function(count) {
    return boards.decTotalThreadCount(id)
    .then(function() { return count; });
  });
};

var increment = function(key, lock, promise) {
  var count = 0;
  db.metadata.getAsync(key)
  .then(function(dbCount) {
    count = Number(dbCount);
    count++;
    return count;
  })
  .catch(function() { return count; })
  .then(function(newCount) {
    return db.metadata.putAsync(key, newCount);
  })
  .then(function() { promise.fulfill(count); })
  .catch(function(err) { promise.reject(err); })
  .finally(function() { lock.release(); });
};

var decrement = function(key, lock, promise) {
  var count = 0;
  db.metadata.getAsync(key)
  .then(function(dbCount) {
    count = Number(dbCount);
    if (count > 0) {
      count--;
    }
    return count;
  })
  .catch(function() { return count; })
  .then(function(newCount) {
    return db.metadata.putAsync(key, newCount);
  })
  .then(function() { promise.fulfill(count); })
  .catch(function(err) { promise.reject(err); })
  .finally(function() { lock.release(); });
};