var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var config = require(__dirname + '/config');
var sep = config.sep;
var boards = {};
var modelPrefix = 'board';

boards.create = function(board, cb) {
  if (cb === undefined) cb = null;
  var timestamp = Date.now();
  var id = timestamp + sep + uuid.v1();
  var key = modelPrefix + sep + id;
  board.id = id;
  db.put(key, board, function(err, version) {
    board.version = version;
    return cb(err, board);
  });
};

boards.find = function(id, cb) {
  db.get(modelPrefix + id, cb);
};

boards.all = function(cb) {
  var entries = [];
  db.createReadStream()
  .on('data', function (entry) { entries.push(entry) })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () { cb(null, entries) })
  .on('end', function () { cb(null, entries) });
}

module.exports = boards;

