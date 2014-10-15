var exp = {};
module.exports = exp;

var path = require('path');
var levelup = require('levelup');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var config = require(path.join(__dirname, '..', 'config'));

mkdirp.sync(config.dbPath);

var dbPath = config.dbPath;
var jsonEncoding = {valueEncoding: 'json'};
var utfEncoding = {valueEncoding: 'utf8'};

var tree = require('treedb')(levelup(path.join(dbPath)));
tree.addSecondaryIndex('thread', 'board', 'updated_at');
tree.addSecondaryIndex('post', 'thread', 'created_at');

var db = tree.db.sublevel('content');
var messages = db.sublevel('messages');
var deleted = db.sublevel('deleted');
var metadata = db.sublevel('metadata');
var indexes = db.sublevel('indexes');
var legacy = db.sublevel('legacy');

exp.tree = tree;
exp.content = Promise.promisifyAll(db);
exp.messages = Promise.promisifyAll(messages);
exp.deleted = Promise.promisifyAll(deleted);
exp.metadata = Promise.promisifyAll(metadata);
exp.indexes = Promise.promisifyAll(indexes);
exp.legacy = Promise.promisifyAll(legacy);
