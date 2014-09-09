var schema = {};
module.exports = schema;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var boardSchema = joi.object().keys({
  id: joi.string(),
  name: joi.string().required(),
  description: joi.string(),
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  parent_id: joi.string(),
  children_ids: joi.array(joi.string()),
  children: joi.array(joi.object()),
  deleted: joi.boolean(),
  smf: {
    ID_BOARD: joi.number(),
    ID_PARENT: joi.number()
  }
});

schema.validate = function(board) {
  return validate(board, boardSchema);
};
