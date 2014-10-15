var exp = {};
module.exports = exp;

var path = require('path');
var levelup = require('levelup');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var config = require(path.join(__dirname, '..', 'config'));
var TreeDB = require('treedb');

mkdirp.sync(config.dbPath);

var dbPath = config.dbPath;
var jsonEncoding = {valueEncoding: 'json'};
var utfEncoding = {valueEncoding: 'utf8'};

var db = new TreeDB(levelup(path.join(dbPath))).db;
var messages = db.sublevel('messages');
var deleted = db.sublevel('deleted');
var metadata = db.sublevel('metadata');
var indexes = db.sublevel('indexes');
var legacy = db.sublevel('legacy');

exp.content = Promise.promisifyAll(db);
exp.messages = Promise.promisifyAll(messages);
exp.deleted = Promise.promisifyAll(deleted);
exp.metadata = Promise.promisifyAll(metadata);
exp.indexes = Promise.promisifyAll(indexes);
exp.legacy = Promise.promisifyAll(legacy);
