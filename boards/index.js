var uuid = require('node-uuid');
var path = require('path');
var sublevel = require('level-sublevel');
var db = require(path.join(__dirname, '..', 'db'));
var boardLevel = sublevel(db);
var smfSubLevel = boardLevel.sublevel('meta-smf');
var config = require(path.join(__dirname, '..', 'config'));
var sep = config.sep;
var modelPrefix = config.boards.prefix;
var validator = require(path.join(__dirname , 'validator'));

/* IMPORT */
function importBoard (board, cb) {
  // set created_at and imported_at datetime
  var ts = Date.now();
  if(!board.created_at) { board.created_at = ts; }
  else { board.created_at = Date.parse(board.created_at) || board.created_ad; }
  board.imported_at = ts;

  // genereate board id from created_at
  board.id = board.created_at + uuid.v1({ msecs: board.created_at });

  // generate board key 
  var key = modelPrefix + sep + board.id;

  // insert board into db
  db.put(key, board, function(err, version) {
    board.version = version;

    // insert the board mapping of old id to new id
    if (board.smf) {
      var smfId = board.smf.board_id.toString();
      var key = modelPrefix + sep  + smfId;
      var value = { id: board.id };
      smfSubLevel.put(key, value, function(err) {
        if (err) { return cb(err, undefined); }
        else { return cb(err, board); }
      });
    }
    else {
      return cb(err, board);
    }
  });
}

/* CREATE */
function createBoard (board, cb) {
  // set created_at datetime
  board.created_at = Date.now();
  var id = board.created_at + uuid.v1({ msecs: board.created_at });
  var key = modelPrefix + sep + id;
  board.id = id;
  db.put(key, board, function(err, version) {
    board.version = version;
    return cb(err, board);
  });
}

/* RETRIEVE */
function findBoard(id, cb) {
  var key = modelPrefix + sep + id;
  db.get(key, function(err, board) {
    if (err) {
      return cb(err, null);
    }
    else if (board.parent_id) {
      return cb(null, board);
    }
    else {
      allBoards(function(err, boards) {
        var result = null;
        boards.forEach(function(board) {
          if (board.id === id) {
            result = board;
          }
        });
        return cb(err, result);
      });
    }
  });
}

/*  UPDATE */
function updateBoard(board, cb) {
  // generate db key
  var key = modelPrefix + sep + board.id;

  // see if board already exists
  db.get(key, function(err, value, version) {
    if (err) {
      return cb(new Error('Board Not Found'), undefined);
    }
    else {
      value.name = board.name;
      value.description = board.description;
      // version options
      var opts = { version: version };
      db.put(key, value, opts, function(err, version) {
        value.version = version;
        return cb(err, value);
      });
    }
  });
}

/* DELETE */
function deleteBoard(boardId, cb) {
  // generate db key
  var key = modelPrefix + sep + boardId;

  // see if board already exists
  db.get(key, function(err, board, version) {
    if (err) {
      return cb(new Error('Board Not Found'), undefined);
    }
    else {
      var opts = { version: version };
      db.del(key, opts, function(err, version) {
        board.version = version;

        // delete smf Id Mapping
        if (board.smf) {
          deleteSMFKeyMapping(board.smf.board_id, function(err) {
            if (err) { return cb(err, undefined); }
            else { return cb(null, board); }
          });
        }
        else {
          return cb(null, board);
        }
      });
    }
  });
}

/*  QUERY: board using old id */
function boardByOldId(oldId, cb) {
  smfSubLevel.get(modelPrefix + sep + oldId, cb);
}

/* QUERY: get all boards */
function allBoards(cb) {
  var boards = [];
  var childBoards = [];
  var handler = function() {
    boards.forEach(function(board) {
      var boardChildren = childBoards[board.value.id];
      if (boardChildren) {
        board.value.child_boards = boardChildren;
      }
    });
    return cb(null, boards.map(function(board) {
        return board.value;
      }));
  };

  var searchKey = modelPrefix + sep;
  db.createReadStream({reverse: true, start: searchKey, end: searchKey + '\xff'})
  .on('data', function(board) {
    if (board.value.parent_id) {
      if (!childBoards[board.value.parent_id]) {
        childBoards[board.value.parent_id] = [];
      }
      childBoards[board.value.parent_id].push(board.value);
    }
    else {
      boards.push(board);
    }
  })
  .on('error', cb)
  .on('close', handler)
  .on('end', handler);
}

function deleteSMFKeyMapping(oldId, cb) {
  var oldKey = modelPrefix + sep + oldId;
  smfSubLevel.get(oldKey, function(err, board, version) {
    if (err) { return cb (err, undefined); }
    else {
      var opts = { version: version };
      smfSubLevel.del(oldKey, opts, function(err) {
        if (err) { return cb(err, undefined); }
        else { return cb(null, board); }
      });
    }
  });
}

module.exports = {
  import: function(board, cb) {
    validator.importBoard(board, cb, importBoard);
  },
  create: function(board, cb) {
    validator.createBoard(board, cb, createBoard);
  },
  find: function(id, cb) {
    validator.id(id, cb, findBoard);
  },
  update: function(board, cb) {
    validator.updateBoard(board, cb, updateBoard);
  },
  delete: function(id, cb) {
    validator.id(id, cb, deleteBoard);
  },
  boardByOldId: function(id, cb) {
    validator.id(id, cb, boardByOldId);
  },
  all: function(cb) {
    validator.callback(cb, allBoards);
  }
};

