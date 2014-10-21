var Board = {};
module.exports = Board;

var Promise = require('bluebird');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var prefix = config.boards.prefix;
var catPrefix = config.boards.categoryPrefix;
var sep = config.sep;

/* Board Model Properties
  id:
  created_at
  updated_at
  imported_at
  deleted
  smf: ID_BOARD, ID_PARENT
  name
  description
  category_id
  parent_id
  children_ids
  post_count
  thread_count
  total_post_count
  total_thread_count
  last_post_username
  last_post_created_at
  last_thread_title
  last_thread_id
*/

var keyForBoard = function(id) {
  return prefix + sep + id;
};

Board.key = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id);
  }
  return key;
};

Board.legacyKey = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

Board.categoryKey = function(catId) {
  var key;
  if (catId) {
    key = catPrefix + sep + catId;
  }
  return key;
};

Board.postCountKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'post_count';
  }
  return key;
};

Board.threadCountKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'thread_count';
  }
  return key;
};

Board.totalPostCountKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'total_post_count';
  }
  return key;
};

Board.totalThreadCountKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'total_thread_count';
  }
  return key;
};

Board.lastPostUsernameKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'last_post_username';
  }
  return key;
};

Board.lastPostCreatedAtKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'last_post_created_at';
  }
  return key;
};

Board.lastThreadTitleKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'last_thread_title';
  }
  return key;
};

Board.lastThreadIdKey = function(id) {
  var key;
  if (id) {
    key = keyForBoard(id) + config.sep + 'last_thread_id';
  }
  return key;
};

Board.prefix = prefix;
