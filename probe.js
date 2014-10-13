var probe = {};
module.exports = probe;

var Promise = require('bluebird');
var path = require('path');
var db = require(path.join(__dirname, 'db'));

probe.get = function(dbName, key) {
  return db[dbName].getAsync(key);
};

probe.all = function(dbName) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    var sorter = function(entry) { entries.push(entry); };
    var handler = function() { fulfill(entries); };

    var query = {
      gte: '\x00',
      lte: '\xff'
    };
    db[dbName].createReadStream(query)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

probe.del = function(dbName, key) {
  return db[dbName].delAsync(key);
};

probe.clean = function() {
  var CONTENT = 'content';
  var INDEXES = 'indexes';
  var METADATA = 'metadata';
  var DELETED = 'deleted';
  var LEGACY = 'legacy';
  var MESSAGES = 'messages';

  return probe.all(CONTENT)
  .then(function(content) {
    return Promise.map(content, function(data) {
      return probe.del(CONTENT, data.key);
    });
  })
  .then(function() {
    return probe.all(INDEXES)
    .then(function(indexes) {
      return Promise.map(indexes, function(data) {
        return probe.del(INDEXES, data.key);
      });
    });
  })
  .then(function() {
    return probe.all(METADATA)
    .then(function(metadata) {
      return Promise.map(metadata, function(data) {
        return probe.del(METADATA, data.key);
      });
    });
  })
  .then(function() {
    return probe.all(DELETED)
    .then(function(deleted) {
      return Promise.map(deleted, function(data) {
        return probe.del(DELETED, data.key);
      });
    });
  })
  .then(function() {
    return probe.all(LEGACY)
    .then(function(legacy) {
      return Promise.map(legacy, function(data) {
        return probe.del(LEGACY, data.key);
      });
    });
  })
  .then(function() {
    return probe.all(MESSAGES)
    .then(function(messages) {
      return Promise.map(messages, function(data) {
        return probe.del(MESSAGES, data.key);
      });
    });
  });
}
