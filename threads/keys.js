var Thread = {};
module.exports = Thread;

var path = require('path');
var dbHelper = require(path.join(__dirname, '..', 'db', 'helper'));
var encodeIntHex = dbHelper.encodeIntHex;
var config = require(path.join(__dirname, '..', 'config'));
var indexPrefix = config.threads.indexPrefix;
var prefix = config.threads.prefix;
var sep = config.sep;
Thread.prefix = prefix;
Thread.indexPrefix = indexPrefix;

/* Thread Model Property
  id
  created_at
  imported_at
  view_count
  deleted
  smf: ID_TOPIC
  board_id
  last_post_username
  last_post_created_at
  post_count
  first_post_id
  user
*/

var keyForThread = function(id) {
  return prefix + sep + id;
};

Thread.key = function(id) {
  var key;
  if (id) {
    key = keyForThread(id);
  }
  return key;
};

Thread.legacyKey = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

Thread.boardThreadKey = function(id, board_id, timestamp) {
  var boardThreadKey;
  if (id && board_id && timestamp) {
    boardThreadKey = indexPrefix + sep + board_id + sep + timestamp + sep + id;
  }
  return boardThreadKey;
};

Thread.postCountKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'post_count';
  }
  return key;
};

Thread.firstPostIdKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'first_post_id';
  }
  return key;
};

Thread.titleKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'title';
  }
  return key;
};

Thread.usernameKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'username';
  }
  return key;
};

Thread.lastPostUsernameKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'last_post_username';
  }
  return key;
};

Thread.lastPostCreatedAtKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'last_post_created_at';
  }
  return key;
};

Thread.viewCountKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'view_count';
  }
  return key;
};

Thread.threadOrderKey = function(id) {
  var key;
  if (id) {
    key = keyForThread(id) + config.sep + 'thread_order';
  }
  return key;
};

Thread.boardThreadOrderKey = function(boardId, order) {
  var key;
  if (boardId && order) {
    var threadOrder = encodeIntHex(order);
    key = indexPrefix + sep + boardId + sep + 'order' + sep + threadOrder;
  }
  return key;
};
