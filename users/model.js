module.exports = User;
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var validate = require(path.join(__dirname, 'validate'));
var prefix = config.users.prefix;
var indexPrefix = config.users.indexPrefix;
var sep = config.sep;

function User(data) {
  if (!(this instanceof User)) {
    return new User(data);
  }

  // data.id signifies existing user
  if (data.id) { this.id = data.id; }
  if (data.created_at) { this.created_at = data.created_at; }
  if (data.updated_at) { this.updated_at = data.updated_at; }
  if (data.imported_at) { this.imported_at = data.imported_at; }
  if (data.deleted) { this.deleted = data.deleted; }

  this.username = data.username;
  this.email = data.email;
  this.password = data.password;
  this.confirmation = data.confirmation;
  if (data.passhash) { this.passhash = data.passhash; }

  if (data.smf && data.smf.ID_MEMBER) { this.smf = data.smf; }
}

User.prototype.validateCreate = function() {
  var user = this;
  return validate.create(user);
};

User.prototype.validateImport = function() {
  var user = this;
  return validate.import(user);
};

User.prototype.validateUpdate = function() {
  var user = this;
  return validate.update(user);
};

User.prototype.simple = function() {
  var user = {};
  var self = this;

  if (self.id) { user.id = self.id; }
  if (self.created_at) { user.created_at = self.created_at; }
  if (self.updated_at) { user.updated_at = self.updated_at; }
  if (self.imported_at) { user.imported_at = self.imported_at; }
  if (self.deleted) { user.deleted = self.deleted; }
  if (self.smf && self.smf.ID_MEMBER) { user.smf = self.smf; }

  if (self.username) { user.username = self.username; }
  if (self.email) { user.email = self.email; }
  if (self.password) { user.password = self.password; }
  if (self.passhash) { user.passhash = self.passhash; }
  if (self.confirmation) { user.confirmation = self.confirmation; }

  return user;
};

User.prototype.key = function() {
  var self = this;
  return keyForUser(self.id);
};

User.prototype.legacyKey = function() {
  var self = this;
  return legacyKeyForUser(self.smf.ID_MEMBER);
};

User.prototype.usernameKey = function() {
  var self = this;
  return usernameKeyForUser(self.username);
};

User.prototype.emailKey = function() {
  var self = this;
  return emailKeyForUser(self.email);
};

// Static Methods

User.keyFromId = function(id) {
  return keyForUser(id);
};

User.legacyKeyFromId = function(legacyId) {
  return legacyKeyForUser(legacyId);
};

User.usernameKeyFromInput = function(username) {
  return usernameKeyForUser(username);
};

User.emailKeyFromInput = function(email) {
  return emailKeyForUser(email);
};

User.userViewsKey = function(userId) {
  return 'user_views' + sep + userId;
};

// Helper Functions

var keyForUser = function(id) {
  var key;
  if (id) { key = prefix + sep + id; }
  return key;
};

var legacyKeyForUser = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyId = legacyId.toString();
    legacyKey = prefix + sep + legacyId;
  }
  return legacyKey;
};

var usernameKeyForUser = function(username) {
  var usernameKey;
  if (username) {
    usernameKey = indexPrefix + sep + 'username' + sep + username;
  }
  return usernameKey;
};

var emailKeyForUser = function(email) {
  var emailKey;
  if (email) {
    emailKey = indexPrefix + sep + 'email' + sep + email;
  }
  return emailKey;
};

// Static Properties

User.prefix = prefix;
User.indexPrefix = indexPrefix;
