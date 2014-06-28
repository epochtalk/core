var levelup = require('levelup');
var options = {
  valueEncoding: 'json'
};
var db = levelup(__dirname + '/epochcore_db', options)

module.exports = db;
