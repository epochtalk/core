var db = {};

var path = require('path');
var levelup = require('levelup');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var config = require(path.join(__dirname, 'config'));
var mkdirp = require('mkdirp');

mkdirp.sync(path.join(__dirname, config.dbPath));
var content = levelup(path.join(config.dbPath, 'content'), {valueEncoding: 'json'});
var messages = levelup(path.join(config.dbPath, 'messages'), {valueEncoding: 'json'});
var deleted = levelup(path.join(config.dbPath, 'deleted'), {valueEncoding: 'json'});
var metadata = levelup(path.join(config.dbPath, 'metadata'), {valueEncoding: 'utf8'});
var indexes = levelup(path.join(config.dbPath, 'indexes'), {valueEncoding: 'utf8'});
var legacy = levelup(path.join(config.dbPath, 'legacy'), {valueEncoding: 'utf8'});
db.content = Promise.promisifyAll(content);
db.messages = Promise.promisifyAll(messages);
db.deleted = Promise.promisifyAll(deleted);
db.metadata = Promise.promisifyAll(metadata);
db.indexes = Promise.promisifyAll(indexes);
db.legacy = Promise.promisifyAll(legacy);

module.exports = db;
