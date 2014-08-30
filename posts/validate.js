var validator = {};
module.exports = validator;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var createSchema = joi.object().keys({
  id: joi.string(),
  title: joi.string().required(),
  body: joi.string().required(),
  user_id: joi.string().required(),
  thread_id: joi.string().required(),
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  deleted: joi.boolean(),
  version: joi.number(),
  smf: {
    ID_MEMBER: joi.number(),
    thread_id: joi.number(),
    post_id: joi.number()
  }
});

validator.create = function(post) {
  return validate(post, createSchema);
};

var importSchema = joi.object().keys({
  id: joi.string(),
  title: joi.string().required(),
  body: joi.string().required(),
  user_id: joi.string(),
  thread_id: joi.string().required(),
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  deleted: joi.boolean(),
  version: joi.number(),
  smf: {
    ID_MEMBER: joi.number(),
    thread_id: joi.number(),
    post_id: joi.number()
  }
});

validator.import = function(post) {
  return validate(post, importSchema);
};
