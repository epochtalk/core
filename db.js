var db = {};
module.exports = db;

var path = require('path');
var levelup = require('levelup');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var config = require(path.join(__dirname, 'config'));

mkdirp.sync(path.join(__dirname, config.dbPath));

var dbPath = config.dbPath;
var jsonEncoding = {valueEncoding: 'json'};
var utfEncoding = {valueEncoding: 'utf8'};

var content = levelup(path.join(dbPath, 'content'), jsonEncoding);
var messages = levelup(path.join(dbPath, 'messages'), jsonEncoding);
var deleted = levelup(path.join(dbPath, 'deleted'), jsonEncoding);
var metadata = levelup(path.join(dbPath, 'metadata'), utfEncoding);
var indexes = levelup(path.join(dbPath, 'indexes'), utfEncoding);
var legacy = levelup(path.join(dbPath, 'legacy'), utfEncoding);

db.content = Promise.promisifyAll(content);
db.messages = Promise.promisifyAll(messages);
db.deleted = Promise.promisifyAll(deleted);
db.metadata = Promise.promisifyAll(metadata);
db.indexes = Promise.promisifyAll(indexes);
db.legacy = Promise.promisifyAll(legacy);

