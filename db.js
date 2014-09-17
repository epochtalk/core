var db = {};
module.exports = db;

var path = require('path');
var levelup = require('levelup');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var config = require(path.join(__dirname, 'config'));
var Sublevel = require('level-sublevel');

mkdirp.sync(config.dbPath);

var dbPath = config.dbPath;
var jsonEncoding = {valueEncoding: 'json'};
var utfEncoding = {valueEncoding: 'utf8'};

var content = Sublevel(levelup(path.join(dbPath), jsonEncoding));
var messages = content.sublevel('messages');
var deleted = content.sublevel('deleted');
var metadata = content.sublevel('metadata');
var indexes = content.sublevel('indexes');
var legacy = content.sublevel('legacy');

db.content = Promise.promisifyAll(content);
db.messages = Promise.promisifyAll(messages);
db.deleted = Promise.promisifyAll(deleted);
db.metadata = Promise.promisifyAll(metadata);
db.indexes = Promise.promisifyAll(indexes);
db.legacy = Promise.promisifyAll(legacy);

