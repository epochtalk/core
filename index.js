var path = require('path');
var config = require(path.join(__dirname, 'config'));
var db = require(path.join(__dirname, 'db'));
var core;

module.exports = function(pathToDB) {
  // check that this already exists
  if (core) { return core; }

  // handle dbPath
  var dbPath = '';
  if (pathToDB) { dbPath = pathToDB; }
  else { dbPath = config.dbPath; }

  // start db engine
  var engine = db(dbPath);

  // configure and attached core pieces
  core = {};
  core.users = require(path.join(__dirname, 'users'))(engine);
  core.boards = require(path.join(__dirname, 'boards'))(engine);
  core.posts = require(path.join(__dirname, 'posts'))(engine);
  core.threads = require(path.join(__dirname, 'threads'))(engine);

  // hide this behind a development switch
  core.engine = engine;

  return core;
};

