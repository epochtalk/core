var schema = {};
module.exports = schema;

var Promise = require('bluebird');
var joi = require('joi');
var validate = Promise.promisify(joi.validate);

var boardSchema = joi.object().keys({
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  id: joi.string(),
  name: joi.string().required(),
  description: joi.string(),
  parent_id: joi.string(),
  children_ids: joi.array(joi.string()),
  children: joi.array(joi.object()),
  deleted: joi.boolean(),
  smf: {
    board_id: joi.number()
  }
});

schema.validate = function(board) {
  return validate(board, boardSchema);
};