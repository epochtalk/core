var threads = {};
module.exports = threads;
var path = require('path');
var uuid = require('node-uuid');
var db = require(path.join(__dirname, '..', 'db'));
var config = require(path.join(__dirname, '..', 'config'));

threads.insert = function(thread) {
  var timestamp = Date.now();
  thread.created_at = timestamp;
  thread.updated_at = timestamp;
  thread.id = timestamp + uuid.v1({ msecs: timestamp });

  return db.content.putAsync(thread.getKey(), thread)
  .then(function() {
    return thread;
  });
}

threads.remove = function(thread) {
  return db.content.delAsync(thread.getKey())
  .then(function() {
    db.deleted.putAsync(thread.getKey, thread);
  })
  .then(function() {
    return thread;
  });
}

threads.find = function(id) {
  return db.content.getAsync(config.threads.prefix + config.sep + id)
  .then(function(thread) {
    return thread;
  });
}
