var boards = {};
module.exports = boards;

var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var through2 = require('through2');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var tree = db.tree;
var Board = require(path.join(__dirname, 'keys'));
var helper = require(path.join(__dirname, '..', 'helper'));
var Padlock = require('padlock').Padlock;
var postCountLock = new Padlock();
var threadCountLock = new Padlock();
var updateParentLock = new Padlock();
var catLock = new Padlock();

boards.import = function(board) {
  var insertBoard = function() {
    return boards.create(board) // create board first to handle id
    .then(function(dbBoard) {
      if (dbBoard.smf) {
        return db.legacy.putAsync(Board.legacyKey(board.smf.ID_BOARD), dbBoard.id)
        .then(function() { return dbBoard; });
      }
    });
  };

  board.imported_at = Date.now();
  var promise;
  if (board.smf.ID_PARENT) {
    promise = db.legacy.getAsync(Board.legacyKey(board.smf.ID_PARENT))
    .then(function(parentBoardId) {
      board.parent_id = parentBoardId;
    })
    .then(insertBoard);
  }
  else {
    promise = insertBoard();
  }
  return promise;
};

boards.create = function(board) {
  return new Promise(function(fulfill, reject) {
    // insert into db
    var timestamp = Date.now();
    if (!board.created_at) {
      board.created_at = timestamp;
      board.updated_at = timestamp;
    }
    else if (!board.updated_at) {
      board.updated_at = board.created_at;
    }
    var newBoard = {
      type: 'board',
      callback: function(options) {
        var storedBoard = options.value;
        if (options.err) {
          reject(options.err);
        }
        else {
          storedBoard.id = options.key[1];
          fulfill(storedBoard);
        }
      }
    };
    if (board.parent_id) {
      newBoard.parentKeys = [['board', board.parent_id]];
      delete board.parent_id;
    }
    newBoard.object = board;
    tree.store(newBoard);
  });
};

boards.find = function(id) {
  function getChildrenArray(parentKey) {
    return new Promise(function(fulfill, reject) {
      var storedChildren = [];
      tree.children({parentKey: parentKey, type: 'board'}).pipe(through2.obj(function(storedChild, enc, callback) {
        storedChildren.push(storedChild);
        callback();
      }, function() {
        fulfill(storedChildren);
      }));
    })
    .then(function(storedChildren) {
      return Promise.map(storedChildren, helper.decMetadata);
    });
  };
  return new Promise(function(fulfill, reject) {
    tree.get(['board', id], function(err, storedBoard) {
      if (err) { reject(err); }
      else { fulfill(storedBoard); }
    });
  })
  .then(function(storedBoard) {
    return Promise.join(
      helper.decMetadata(storedBoard),
      getChildrenArray(storedBoard.key),
      function(board, children) {
        // check if a result was found
        if (children.length) {
          board.children = children;
        }
        return board;
      }
    );
  });
};

boards.update = function(board) {
  var boardKey = Board.key(board.id);
  var updateBoard = null;

  // get old board from db
  return db.content.getAsync(boardKey)
  .then(function(oldBoard) {
    updateBoard = oldBoard;

    // update board values
    if (board.name) { updateBoard.name = board.name; }

    if (board.description) { updateBoard.description = board.description; }
    else if (board.description === null) { delete updateBoard.description; }
    else if (board.description && board.description === "") {
      delete updateBoard.description;
    }

    if (board.category_id) { updateBoard.category_id = board.category_id; }
    else if (board.category_id === null) { delete updateBoard.category_id; }
    else if (board.category_id && board.category_id === "") {
      delete updateBoard.category_id;
    }

    if (board.parent_id) { updateBoard.parent_id = board.parent_id; }
    else if (board.parent_id === null) { delete updateBoard.parent_id; }
    else if (board.parent_id && board.parent_id === "") {
      delete updateBoard.parent_id;
    }

    if (board.children_ids) { updateBoard.children_ids = board.children_ids; }
    else if (board.children_ids === null) { delete updateBoard.children_ids; }
    else if (board.children_ids && board.children_ids.length === 0) {
      delete updateBoard.children_ids;
    }

    updateBoard.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(boardKey, updateBoard)
    .then(function() { return updateBoard; });
  });
};

boards.delete = function(boardId) {
  var boardKey = Board.key(boardId);
  var deleteBoard;

  // see if board already exists
  return db.content.getAsync(boardKey)
  .then(function(boardData) {
    deleteBoard = boardData;
    if (deleteBoard.children_ids && deleteBoard.children_ids.length > 0) {
      throw new Error('Cannot delete parent board with child boards.');
    }
    else {
      // add deleted: true flag to board
      deleteBoard.deleted = true;
      deleteBoard.updated_at = Date.now();

      // insert back into db
      return db.content.putAsync(boardKey, deleteBoard);
    }
  })
  .then(function() { return deleteBoard; });
};

boards.undelete = function(boardId) {
  var boardKey = Board.key(boardId);
  var deleteBoard;

  // see if board already exists
  return db.content.getAsync(boardKey)
  .then(function(boardData) {
    deleteBoard = boardData;

    // add deleted: true flag to board
    delete deleteBoard.deleted;
    deleteBoard.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(boardKey, deleteBoard);
  })
  .then(function() { return deleteBoard; });
};

boards.purge = function(id) {
  var purgeBoard;
  var boardKey = Board.key(id);

  // see if board already exists
  return db.content.getAsync(boardKey)
  // set board to function scope
  .then(function(boardData) {
    purgeBoard = boardData;
    if (purgeBoard.children_ids && purgeBoard.children_ids.length > 0) {
      throw new Error('Cannot purge parent board with child boards.');
    }
  })
  // delete id from parent board if necessary
  .then(function() {
    if (purgeBoard.parent_id) {
      return removeChildFromBoard(purgeBoard.id, purgeBoard.parent_id);
    }
    else { return; }
  })
  // delete metadata
  .then(function() {
    var postCountKey = Board.postCountKey(id);
    var threadCountKey = Board.threadCountKey(id);
    var totalPostCountKey = Board.totalPostCountKey(id);
    var totalThreadCountKey = Board.totalThreadCountKey(id);
    var lastPostUsernameKey = Board.lastPostUsernameKey(id);
    var lastPostCreatedAtKey = Board.lastPostCreatedAtKey(id);
    var lastThreadTitleKey = Board.lastThreadTitleKey(id);
    var lastThreadIdKey = Board.lastThreadIdKey(id);
    var deleteBatch = [
      { type: 'del', key: postCountKey },
      { type: 'del', key: threadCountKey },
      { type: 'del', key: totalPostCountKey },
      { type: 'del', key: totalThreadCountKey },
      { type: 'del', key: lastPostUsernameKey },
      { type: 'del', key: lastPostCreatedAtKey },
      { type: 'del', key: lastThreadTitleKey },
      { type: 'del', key: lastThreadIdKey }
    ];
    return db.metadata.batchAsync(deleteBatch);
  })
  // delete legacy key index
  .then(function() {
    if (purgeBoard.smf) {
      var legacyKey = Board.legacyKey(purgeBoard.smf.ID_BOARD);
      return db.legacy.delAsync(legacyKey);
    }
    return;
  })
  // delete Board from category and remove boards category id
  .then(function() {
    if (purgeBoard.category_id) {
      return boards.categoryDeleteBoard(purgeBoard)
      .then(function() { delete purgeBoard.category_id; });
    }
    return;
  })
  // move board to deleted db
  .then(function() {
    return db.deleted.putAsync(boardKey, purgeBoard);
  })
  // remove board from content
  .then(function() {
    return db.content.delAsync(boardKey);
  })
  // return this board
  .then(function() { return purgeBoard; });
};

/*  QUERY: board using old id */
boards.boardByOldId = function(oldId) {
  var legacyBoardKey = Board.legacyKey(oldId);

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
    var boardKeys = [];
    var sorter = function(entry) { boardKeys.push(entry.key); };
    var handler = function() { return fulfill(boardKeys); };
    db.tree.nodes({type: 'board', indexedField: 'name' })
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  })
  .then(function(allBoards) {
    return Promise.map(allBoards, function(boardKey) {
      return boards.find(boardKey[1]);
    })
    .then(function(allBoards) {
      var boards = [];
      allBoards.forEach(function(board) {
        if (!board.parent_id) {
          boards.push(board);
        }
      });
      return boards;
    });
  });
};

var addChildToBoard = function(childId, parentId) {
  var parentBoard;
  return new Promise(function(fulfill, reject) {
    updateParentLock.runwithlock(function () {
      var parentBoardKey = Board.key(parentId);
      return db.content.getAsync(parentBoardKey)
      .then(function(dbParentBoard) {
        parentBoard = dbParentBoard;
        parentBoard.children_ids = dbParentBoard.children_ids || [];
        if (!_.contains(parentBoard.children_ids, childId)) {
          parentBoard.children_ids.push(childId);
          return db.content.putAsync(parentBoardKey, parentBoard);
        }
        // parent board already has child board id in children_ids
        return;
      })
      .then(function() { fulfill(parentBoard); })
      .catch(function(err) { reject(err); })
      .finally(function() { updateParentLock.release(); });
    });
  });
};

var removeChildFromBoard = function(childId, parentId) {
  var parentBoard;
  return new Promise(function(fulfill, reject) {
    updateParentLock.runwithlock(function () {
      var parentBoardKey = Board.key(parentId);
      return db.content.getAsync(parentBoardKey)
      .then(function(dbParentBoard) {
        parentBoard = dbParentBoard;
        if (_.contains(parentBoard.children_ids, childId)) {
          parentBoard.children_ids = _.pull(parentBoard.children_ids, childId);
          if (parentBoard.children_ids.length === 0) {
            delete parentBoard.children_ids;
          }
          return db.content.putAsync(parentBoardKey, parentBoard);
        }
        // parent board doesn't have child board id in children_ids
        return;
      })
      .then(function() { fulfill(parentBoard); })
      .catch(function(err) { reject(err); })
      .finally(function() { updateParentLock.release(); });
    });
  });
};

/* POSSIBLE OPTIMIZATION CANDIDATE */
// Used to handle reordering/removing/renaming of multiple categories at once
boards.updateCategories = function(categories) {
  return new Promise(function(outerFulfill, outerReject) {
    catLock.runwithlock(function() {
      var catPrefix = config.boards.categoryPrefix;
      var sep = config.sep;

      // Query boards update category_id
      var resyncBoards = function(boardIds, categoryId) {
        return Promise.map(boardIds, function(boardId) {
          var newBoard = { id: boardId, category_id: categoryId };
          return boards.update(newBoard);
        });
      };

      var processCategories = function(newCategories) {
        return Promise.map(newCategories, function(entry) {
          var catKey = entry.key;
          var boardIds = entry.value.board_ids;
          return db.metadata.delAsync(catKey)
          .then(function() {
            return Promise.map(boardIds, function(boardId) {
              var modifiedBoard = { id: boardId, category_id: null };
              return boards.update(modifiedBoard);
            });
          });
        });
      };

      return new Promise(function(fulfill, reject) {
        var entries = [];
        var pushEntries = function(entry) { entries.push(entry); };
        var handler = function() { fulfill(entries); };

        var startKey = catPrefix + sep;
        var endKey = startKey;
        startKey += '\x00';
        endKey += '\xff';

        var queryOptions = {
          gte: startKey,
          lte: endKey
        };
        // query thread Index
        db.metadata.createReadStream(queryOptions)
        .on('data', pushEntries)
        .on('error', reject)
        .on('close', handler)
        .on('end', handler);
      })
      .then(function(catArray) {
        return processCategories(catArray);
      })
      .then(function() {
        var categoryId = 1;
        Promise.each(categories, function(category) {
          var catKey = catPrefix + sep + categoryId;
          delete category.boards;

          return db.metadata.putAsync(catKey, category)
          .then(function() {
            return resyncBoards(category.board_ids, categoryId++);
          });
        })
        .then(function() {
          catLock.release();
          return outerFulfill(categories);
        });
      });
    });
  });
};

boards.categoryDeleteBoard = function(board) {
  return new Promise(function(fulfill, reject) {
    catLock.runwithlock(function() {
      if (!board.category_id || board.category_id === null) {
        var catErr = new Error('Board must have a category_id inorder to delete it from a category.');
        catLock.release();
        return reject(catErr);
      }
      else {
        var catKey = Board.categoryKey(board.category_id);
        var modifiedCategory;
        return db.metadata.getAsync(catKey)
        .then(function(category) {
          modifiedCategory = category;
          _.pull(modifiedCategory.board_ids, board.id);
          return db.metadata.putAsync(catKey, modifiedCategory);
        })
        .then(function() {
          catLock.release();
          return fulfill(modifiedCategory);
        });
      }
    });
  });
};

// Used to bring back all boards in their respective categories
boards.allCategories = function() {
  return new Promise(function(fulfill, reject) {
    var cats = [];

    var pushCats = function(category) {
      cats.push(category);
    };

    var handler = function() {
      return fulfill(cats);
    };

    var catPrefix = config.boards.categoryPrefix;
    var sep = config.sep;
    var startKey = catPrefix + sep;
    var endKey = startKey;
    startKey += '\x00';
    endKey += '\xff';

    var queryOptions = {
      gte: startKey,
      lte: endKey
    };
    // query thread Index
    db.metadata.createValueStream(queryOptions)
    .on('data', pushCats)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};
