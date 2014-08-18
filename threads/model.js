module.exports = Thread;
var _ = require('lodash');
var uuid = require('node-uuid');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));

function Thread(data) {
  if (!(this instanceof Thread)) {
    return new Thread(json);
  }
  // data.id signifies existing thread
  if (data.id) {
    this.id = data.id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
  this.body = data.body;
}

Thread.prototype.getKey = function() {
  return config.threads.prefix + config.sep + this.id;
}

