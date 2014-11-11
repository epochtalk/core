var validator = {};
module.exports = validator;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var importSchema = joi.object().keys({
  user_id: joi.string(),
  thread_id: joi.string().required(),
  title: joi.string().required(),
  encodedBody: joi.string().required(),
  created_at: joi.number(),
  updated_at: joi.number(),
  smf: {
    ID_MEMBER: joi.number(),
    ID_TOPIC: joi.number(),
    ID_MSG: joi.number()
  }
});
validator.import = function(post) {
  return validate(post, importSchema);
};

var createSchema = joi.object().keys({
  user_id: joi.string().required(),
  thread_id: joi.string().required(),
  title: joi.string().required(),
  encodedBody: joi.string().required()
});
validator.create = function(post) {
  return validate(post, createSchema, { stripUnknown: true });
};

var updateSchema = joi.object().keys({
  thread_id: joi.string().required(),
  id: joi.string().required(),
  title: joi.string().required(),
  encodedBody: joi.string().required()
});
validator.update = function(post) {
  return validate(post, updateSchema, { stripUnknown: true });
};

var idSchema = joi.string().min(1);
validator.id = function(id) {
  return validate(id, idSchema);
};

var numIdSchema = joi.number().min(1);
validator.numId = function(numId) {
  return validate(numId, numIdSchema);
};
