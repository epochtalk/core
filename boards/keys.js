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
  var boardKey;
  if (id) { boardKey = prefix + sep + id; }
  return boardKey;
};

Board.key = function(id) {
  return keyForBoard(id);
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
  return catPrefix + sep + catId;
};

Board.postCountKey = function(id) {
  return keyForBoard(id) + config.sep + 'post_count';
};

Board.threadCountKey = function(id) {
  return keyForBoard(id) + config.sep + 'thread_count';
};

Board.totalPostCountKey = function(id) {
  return keyForBoard(id) + config.sep + 'total_post_count';
};

Board.totalThreadCountKey = function(id) {
  return keyForBoard(id) + config.sep + 'total_thread_count';
};

Board.lastPostUsernameKey = function(id) {
  return keyForBoard(id) + config.sep + 'last_post_username';
};

Board.lastPostCreatedAtKey = function(id) {
  return keyForBoard(id) + config.sep + 'last_post_created_at';
};

Board.lastThreadTitleKey = function(id) {
  return keyForBoard(id) + config.sep + 'last_thread_title';
};

Board.lastThreadIdKey = function(id) {
  return keyForBoard(id) + config.sep + 'last_thread_id';
};

Board.prefix = prefix;
