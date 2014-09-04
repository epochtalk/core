module.exports = User;
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var validate = require(path.join(__dirname, 'validate'));
var prefix = config.users.prefix;
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
  this.password = data.password;
  this.email = data.email;
  this.confirmation = data.confirmation;

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
  if (self.password) { user.password = self.password; }
  if (self.email) { user.email = self.email; }
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

// Static Methods

User.keyFromId = function(id) {
  return keyForUser(id);
};

User.legacyKeyForId = function(legacyId) {
  return legacyKeyForUser(legacyId);
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

// Static Properties

User.prefix = prefix;
