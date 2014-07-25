var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var config = require(__dirname + '/config');
var helper = require(__dirname + '/helper');
var sep = config.sep;
var boards = {};
var modelPrefix = config.boards.prefix;

// helpers
var makeHandler = helper.makeHandler;

/*
  CREATE 
*/
boards.create = function(board, cb) {
  if (cb === undefined) cb = null;
  var timestamp = Date.now();
  var id = timestamp + uuid.v1();
  var key = modelPrefix + sep + id;
  board.id = id;
  board.created_at = timestamp;
  db.put(key, board, function(err, version) {
    board.version = version;
    return cb(err, board);
  });
};

/*
  RETRIEVE
*/
boards.find = function(id, cb) {
  if (cb === undefined) cb = null;
  db.get(modelPrefix + sep + id, cb);
};

/* 
  UPDATE
*/
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

/*
  DELETE
*/
boards.delete = function(boardId, cb) {
  if (cb === undefined) cb = null;
  
  // generate db key
  var key = modelPrefix + sep + boardId;

  // see if board already exists
  db.get(key, function(err, value, version) {
    if (err) {
      return cb(new Error('Board Not Found'), undefined);
    }
    else {
      var opts = { version: version };
      db.del(key, opts, function(err, version) {
        value.version = version;
        return cb(null, value);
      });
    }
  });
};

boards.all = function(cb) {
  var entries = [];
  var handler = makeHandler(entries, cb);
  var searchKey = modelPrefix;
  db.createReadStream({reverse: true, start: searchKey, end: searchKey + '\xff'})
  .on('data', function(entry) {
    entries.push(entry);
  })
  .on('error', cb)
  .on('close', handler)
  .on('end', handler);
};

module.exports = boards;

