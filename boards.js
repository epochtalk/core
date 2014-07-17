var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var boards = {};
var modelPrefix = 'board\x00';

boards.create = function(board, cb) {
  var id = uuid.v1();
  var key = modelPrefix + id;
  board.id = id;
  db.put(key, board, function(err, body) {
    console.log(body);
  });
};

boards.find = function(id, cb) {
  db.get(modelPrefix + id, cb);
};

boards.all = function(cb) {
  var entries = []
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry) })
    .on('close', function () { cb(null, entries) })
}

module.exports = boards;

