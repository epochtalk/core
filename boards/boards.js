var uuid = require('node-uuid');
var path = require('path');
var db = require(path.join(__dirname, '..', 'db'));
var sublevel = require('level-sublevel');
var boardLevel = sublevel(db);
var smfSubLevel = boardLevel.sublevel('meta-smf');
var config = require(path.join(__dirname, '..', 'config'));
var sep = config.sep;
var modelPrefix = config.boards.prefix;
var helper = require(path.join(__dirname, '..', 'helper'));
var validator = require(path.join(__dirname , 'validator'));
var boards = {};

// helpers
var makeHandler = helper.makeHandler;


/* IMPORT */
function importBoard (board, cb) {
  // set imported_at datetime
  board.imported_at = Date.now();

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
  var timestamp = Date.now();
  var id = timestamp + uuid.v1({ msecs: timestamp });
  var key = modelPrefix + sep + id;
  board.id = id;
  board.created_at = timestamp;

  db.put(key, board, function(err, version) {
    board.version = version;
    return cb(err, board);
  });
}

/* RETRIEVE */
function findBoard(id, cb) {
  db.get(modelPrefix + sep + id, cb);
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
  var entries = [];
  var handler = makeHandler(entries, cb);
  var searchKey = modelPrefix + sep;
  db.createReadStream({reverse: true, start: searchKey, end: searchKey + '\xff'})
  .on('data', function(entry) {
    entries.push(entry);
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

