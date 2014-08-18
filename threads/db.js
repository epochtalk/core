var threads = {};
module.exports = threads;
var path = require('path');
var uuid = require('node-uuid');
var async = require('async');
var Promise = require('bluebird');
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

threads.byBoard = function(boardId, opts) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    // return map of entries as an threadId and title
    var handler = function() {
      async.map(entries,
        function(entry, callback) {
          var threadId = entry.value.id;
          var entryObject = { id: threadId };
          // get title of first post of each thread
          threadFirstPost(threadId)
          .then(function(post) {
            entryObject.title = post.title;
            entryObject.created_at = entry.value.created_at;
            return callback(null, entryObject);
          });
        },
        function(err, allThreads) {
          if (err) { return reject(err); }
          if (allThreads) {
            return fulfill(allThreads);
          }
        }
      );
    };

    // query vars
    var endIndexKey = config.threads.indexPrefix + config.sep + boardId + config.sep;
    var startThreadKey = endIndexKey;
    var limit = opts.limit ? Number(opts.limit) : 10;
    if (opts.startThreadId) {
      endIndexKey += opts.startThreadId + '\x00';
    }
    else {
      endIndexKey += '\xff';
    }
    var queryOptions = {
      limit: limit,
      reverse: true,
      start: startThreadKey + '\x00',
      end: endIndexKey
    };

    // query thread Index
    db.content.createReadStream(queryOptions)
    .on('data', function (entry) {
      entries.push(entry);
    })
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
}
