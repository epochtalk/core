var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var config = require(__dirname + '/config');
var sep = config.sep;
var boards = {};
var modelPrefix = 'board';

var makeHandler = function(entries, cb) {
  return function() {
    cb(null, entries.map(function(entry) {
      return entry.value;
    }));
  }
}

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

boards.find = function(id, cb) {
  db.get(modelPrefix + sep + id, cb);
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
}

module.exports = boards;

