var schema = {};
module.exports = schema;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var postSchema = joi.object().keys({
  id: joi.string(),
  title: joi.string().required(),
  body: joi.string().required(),
  thread_id: joi.string().required(),
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  deleted: joi.boolean(),
  user_id: joi.string(),
  version: joi.number(),
  smf: {
    ID_MEMBER: joi.number(),
    thread_id: joi.number(),
    post_id: joi.number()
  }
});

schema.validate = function(post, next) {
  return validate(post, postSchema).then(next);
};
