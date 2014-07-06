var levelup = require('levelup');
var version = require("level-version");
var options = {
  valueEncoding: 'json'
};

var db = version(levelup(__dirname + '/epoch.db', options));

module.exports = db;
