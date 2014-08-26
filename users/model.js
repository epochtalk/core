module.exports = User;
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var validate = require(path.join(__dirname, 'validate'));

function User(data) {
  if (!(this instanceof User)) {
    return new User(data);
  }
  // data.id signifies existing user
  if (data.id) {
    this.id = data.id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
  this.username = data.username;
  this.password = data.password;
  this.confirmation = data.confirmation;

  this.smf = data.smf;
}

User.prototype.validate = function() {
  var user = this;
  return validate.create(user);
}

User.prototype.getKey = function() {
  var key;
  if (this.id) {
    key = config.users.prefix + config.sep + this.id;
  }
  return key;
};

User.legacyKeyForId = function(legacyId) {
  var legacyKey;
  if (legacyId) {
    legacyKey = config.users.prefix + sep + legacyId;
  }
  return legacyKey;
};
