var exp = {};
module.exports = exp;

var path = require('path');
var levelup = require('levelup');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var config = require(path.join(__dirname, '..', 'config'));
var TreeDB = require('treedb');
var TreeDBIndexes = require(path.join(__dirname, '..', 'indexes'));

mkdirp.sync(config.dbPath);

var dbPath = config.dbPath;
var jsonEncoding = {valueEncoding: 'json'};
var utfEncoding = {valueEncoding: 'utf8'};

var tree = new TreeDB(levelup(path.join(dbPath)), {meta: require('epoch-core-meta')});
var db = tree.db;
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
exp.tree = tree;

tree.addIndexes({indexes: TreeDBIndexes});
