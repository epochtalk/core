var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var sublevel = require('level-sublevel');
var config = require(__dirname + '/config');
var helper = require(__dirname + '/helper');
var boardLevel = sublevel(db);
var smfSubLevel = boardLevel.sublevel('meta-smf');
var sep = config.sep;
var boards = {};
var modelPrefix = config.boards.prefix;

// helpers
var makeHandler = helper.makeHandler;

/* IMPORT */
boards.import = function(board, cb) {
  if (!board) { return cb(new Error('No Board Found'), undefined); }
  if (cb === undefined) cb = null;

  // check if created_at exists and set board id 
  var timestamp = Date.now(); // current time
  if (board.created_at) {
    // set imported_at datetime
    board.imported_at = timestamp;
    // genereate board id from old timestamp
    board.id = board.created_at + uuid.v1({ msecs: board.created_at });
  }
  else {
    // use current time as created_at and imported_at
    board.created_at = timestamp;
    board.imported_at = timestamp;
    // genereate board id from current time
    board.id = timestamp + uuid.v1({ msecs: timestamp });
  }

  // generate board key 
  var key = modelPrefix + sep + board.id;

  // pull any smf related data
  var smf = board.smf;

  // insert board into db
  db.put(key, board, function(err, version) {
    board.version = version;

    // insert the board mapping of old id to new id
    if (smf) {
      var key = modelPrefix + sep  + smf.board_id.toString();
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
};

/* CREATE */
boards.create = function(board, cb) {
  if (cb === undefined) cb = null;
  var timestamp = Date.now();
  var id = timestamp + uuid.v1({ msecs: board.created_at });
  var key = modelPrefix + sep + id;
  board.id = id;
  board.created_at = timestamp;
  db.put(key, board, function(err, version) {
    board.version = version;
    return cb(err, board);
  });
};

/* RETRIEVE */
boards.find = function(id, cb) {
  if (cb === undefined) { cb = null; }
  db.get(modelPrefix + sep + id, cb);
};

/*  UPDATE */
boards.update = function(board, cb) {
  if (cb === undefined) cb = null;
  
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
};

/* DELETE */
boards.delete = function(boardId, cb) {
  if (cb === undefined) cb = null;
  
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
};

/*  QUERY: board using old id */
boards.boardByOldId = function(oldId, cb) {
  if (cb === undefined) { cb = null; }
  smfSubLevel.get(modelPrefix + sep + oldId, cb);
};

/* QUERY: get all boards */
boards.all = function(cb) {
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
};

function deleteSMFKeyMapping(oldId, cb) {
  if (cb === undefined) { cb = null; }
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


module.exports = boards;

