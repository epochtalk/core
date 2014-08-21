module.exports = Thread;
var _ = require('lodash');
var uuid = require('node-uuid');
var path = require('path');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var schema = require(path.join(__dirname, 'schema'));
var indexPrefix = config.threads.indexPrefix;
var sep = config.sep;

function Thread(data) {
  console.log(data);
  if (!(this instanceof Thread)) {
    return new Thread(data);
  }
  // data.id signifies existing thread
  if (data.id) {
    this.id = data.id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  this.board_id = data.board_id;
}

Thread.prototype.getKey = function() {
  var key;
  if (this.id) {
    key = config.threads.prefix + config.sep + this.id;
  }
  return key;
}

Thread.prototype.getBoardThreadKey = function() {
  var boardThreadKey;
  if (this.id && this.board_id) {
    boardThreadKey = indexPrefix + sep + this.board_id + sep + this.id;
  }
  return boardThreadKey;
}

Thread.prototype.validate = function() {
  // input validation
  return schema.validate(this); // blocking
}

