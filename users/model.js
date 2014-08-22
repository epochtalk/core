module.exports = User;
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));

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
}

User.prototype.getKey = function() {
  return config.users.prefix + config.sep + this.id;
};

