var db = {};
module.exports = db;

var path = require('path');
var levelup = require('levelup');
var sublevel = require('level-sublevel');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var config = require(path.join(__dirname, 'config'));

mkdirp.sync(config.dbPath);

var dbPath = config.dbPath;
var jsonEncoding = {valueEncoding: 'json'};
var utfEncoding = {valueEncoding: 'utf8'};

var db = sublevel(levelup(dbPath));

var content = db.sublevel('content');
var messages = db.sublevel('messages');
var deleted = db.sublevel('deleted');
var metadata = db.sublevel('metadata');
var indexes = db.sublevel('indexes');
var legacy = db.sublevel('legacy');

db.content = Promise.promisifyAll(content);
db.messages = Promise.promisifyAll(messages);
db.deleted = Promise.promisifyAll(deleted);
db.metadata = Promise.promisifyAll(metadata);
db.indexes = Promise.promisifyAll(indexes);
db.legacy = Promise.promisifyAll(legacy);

