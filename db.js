var levelup = require('levelup');
var options = {
  valueEncoding: 'json'
};
var db = levelup(__dirname + '/epoch.db', options)

module.exports = db;
