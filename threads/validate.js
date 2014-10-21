var validator = {};
module.exports = validator;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var importSchema = joi.object().keys({
  board_id: joi.string().required(),
  created_at: joi.number(),
  updated_at: joi.number(),
  view_count: joi.number(),
  deleted: joi.boolean(),
  smf: {
    ID_MEMBER: joi.number(),
    ID_TOPIC: joi.number(),
    ID_FIRST_MSG: joi.number()
  }
});
validator.import = function(thread) {
  return validate(thread, importSchema);
};

var createSchema = joi.object().keys({
  board_id: joi.string().required()
});
validator.create = function(thread) {
  return validate(thread, createSchema, { stripUnknown: true });
};

var idSchema = joi.string().min(1);
validator.id = function(id) {
  return validate(id, idSchema);
};

var numIdSchema = joi.number().min(1);
validator.numId = function(numId) {
  return validate(numId, numIdSchema);
};