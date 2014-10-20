var Post = {};
module.exports = Post;

var path = require('path');
var dbHelper = require(path.join(__dirname, '..', 'db', 'helper'));
var encodeIntHex = dbHelper.encodeIntHex;
var config = require(path.join(__dirname, '..', 'config'));
var indexPrefix = config.posts.indexPrefix;
var prefix = config.posts.prefix;
var sep = config.sep;
Post.prefix = prefix;
Post.indexPrefix = indexPrefix;

/* Posts Model Properties
  id
  created_at
  updated_at
  imported_at
  deleted
  smf: ID_MSG
  version
  title
  body
  encodedBody
  user_id
  thread_id
*/

var keyForPost = function(id) {
  return prefix + sep + id;
};

Post.key = function(id) {
  var key;
  if (id) { key = keyForPost(id); }
  return key;
};

Post.legacyKey = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

Post.threadPostOrderKey = function(thread_id, count) {
  var key;
  if (thread_id && count) {
    var postOrder = encodeIntHex(count);
    key = indexPrefix + sep + thread_id + sep + postOrder;
  }
  return key;
};

Post.threadKey = function(threadId) {
  var key;
  if (threadId) {
    key = prefix + sep + threadId;
  }
  return key;
};

Post.versionKey = function(id, version) {
  var key;
  if (id && version) {
    key = config.posts.version + sep + id + sep + version;
  }

  return key;
};

Post.usernameKey = function(id) {
  var key;
  if (id) {
    key = keyForPost(id) + sep + 'username';
  }
  return key;
};

Post.postOrderKey = function(id) {
  var postOrderKey;
  if (id) {
    postOrderKey = prefix + sep + id + sep + 'post_order';
  }
  return postOrderKey;
};
