var path = require('path');
var config = require(path.join(__dirname, 'config'));
var core = {};

module.exports = function(dbPath) {
  // handle dbPath
  if (dbPath) {
    config.dbPath = dbPath;
  }

  core.users = require(path.join(__dirname, 'users'));
  core.boards = require(path.join(__dirname, 'boards'));
  core.posts = require(path.join(__dirname, 'posts'));
  core.threads = require(path.join(__dirname, 'threads'));

  return core;
};
