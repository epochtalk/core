var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var users = {};
var modelPrefix = 'user\x00';

users.create = function(user, cb) {
  var id = uuid.v4();
  var key = modelPrefix + id;
  user.id = id;
  db.put(key, user, cb);
};

users.find = function(id, cb) {
  db.get(modelPrefix + id, cb);
};

users.all = function(cb) {
  var entries = []
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry) })
    .on('close', function () { cb(null, entries) })
}

module.exports = users;


