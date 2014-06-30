var levelup = require('levelup')
var db = levelup(__dirname + '/epochcore_db')
var epochcore = {};

module.exports = epochcore;
