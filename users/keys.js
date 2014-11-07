var User = {};
module.exports = User;

var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var prefix = config.users.prefix;
var indexPrefix = config.users.indexPrefix;
var sep = config.sep;
User.prefix = prefix;
User.indexPrefix = indexPrefix;

/* User Model Properties
  id
  created_at
  updated_at
  imported_at
  deleted
  username
  email
  password
  confirmation
  passhash
  reset_token
  reset_expiration
  smf: ID_MEMBER
*/

User.key = function(id) {
  var key;
  if (id) { key = prefix + sep + id; }
  return key;
};

User.legacyKey = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

User.usernameKey = function(username) {
  var usernameKey;
  if (username) {
    usernameKey = indexPrefix + sep + 'username' + sep + username;
  }
  return usernameKey;
};

User.emailKey = function(email) {
  var emailKey;
  if (email) {
    emailKey = indexPrefix + sep + 'email' + sep + email;
  }
  return emailKey;
};

User.userViewsKey = function(userId) {
  var userViewKey;
  if (userId) {
    userViewKey = 'user_views' + sep + userId;
  }
  return userViewKey;
};
