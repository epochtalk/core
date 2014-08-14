var validator = {};
var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var importSchema = joi.object().keys({
  name: joi.string().required(),
  description: joi.string(),
  created_at: joi.date(),
  parent_id: joi.string(),
  smf: {
    board_id: joi.number()
  }
});
validator.importBoard = function(board, next) {
  return validate(board, importSchema).then(next);
};


var createSchema = joi.object().keys({
  name: joi.string().required(),
  description: joi.string(),
  parent_id: joi.string()
});
validator.createBoard = function(board, next) {
  return validate(board, createSchema).then(next);
};


var updateSchema = joi.object().keys({
  id: joi.string(),
  name: joi.string(),
  description: joi.string(),
  created_at: joi.date(),
  imported_at: joi.date(),
  version: joi.number(),
  children_ids: joi.array(),
  parent_id: joi.string(),
  smf: {
    board_id: joi.number()
  }
});
validator.updateBoard = function(board, next) {
  return validate(board, updateSchema).then(next);
};


var findSchema = joi.any().required();
validator.id = function(id, next) {
  return validate(id, findSchema).then(next);
};

module.exports = validator;