var validator = {};
module.exports = validator;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var boardImportSchema =  joi.object().keys({
  name: joi.string().required(),
  description: joi.string(),
  category_id: joi.number(),
  created_at: joi.number(),
  updated_at: joi.number(),
  parent_id: joi.string(),
  children_ids: joi.array(joi.string()),
  deleted: joi.boolean(),
  smf: {
    ID_BOARD: joi.number(),
    ID_PARENT: joi.number()
  }
});

var boardCreateSchema = joi.object().keys({
  name: joi.string().required(),
  description: joi.string(),
  category_id: joi.number(),
  parent_id: joi.string(),
  children_ids: joi.array(joi.string())
});

var updateBoardSchema = joi.object().keys({
  id: joi.string(),
  name: joi.string(),
  description: joi.string(),
  category_id: joi.number(),
  parent_id: joi.string(),
  children_ids: joi.array(joi.string()),
});

var boardIdSchema = joi.string().min(1);

var boardNumIdSchema = joi.number().min(1);

validator.import = function(board) {
  return validate(board, boardImportSchema, { stripUnknown: true });
};

validator.create = function(board) {
  return validate(board, boardCreateSchema, { stripUnknown: true });
};

validator.update = function(board) {
  return validate(board, updateBoardSchema, { stripUnknown: true });
};

validator.id = function(id) {
  return validate(id, boardIdSchema);
};

validator.numId = function(numId) {
  return validate(numId, boardNumIdSchema);
};
