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
      start: '\x00',
      end: '\xff'
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