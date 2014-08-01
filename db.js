var path = require('path');
var levelup = require('levelup');
var version = require('level-version');
var config = require(path.join(__dirname, 'config'));
var options = {
  valueEncoding: 'json'
};

var db = version(levelup(config.dbPath, options));
module.exports = db;
