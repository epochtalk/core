var validator = {};
var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var importSchema = joi.object().keys({
  title: joi.string().required(),
  body: joi.string().required(),
  thread_id: joi.string().required(),
  board_id: joi.string(),
  created_at: joi.date(),
  smf: {
    post_id: joi.number(),
    thread_id: joi.number()
  }
});
validator.importPost = function(post, next) {
  return validate(post, importSchema).then(next);
};

var createSchema = joi.object().keys({
  title: joi.string().required(),
  body: joi.string().required(),
  thread_id: joi.string().required(),
  board_id: joi.string()
});

validator.createPost = function(post, next) {
  return validate(post, createSchema).then(next);
};

var updateSchema = joi.object().keys({
  id: joi.string(),
  title: joi.string(),
  body: joi.string(),
  thread_id: joi.string(),
  created_at: joi.date(),
  imported_at: joi.date(),
  version: joi.number(),
  smf: {
    post_id: joi.number(),
    thread_id: joi.number()
  }
});
validator.updatePost = function(post, next) {
  return validate(post, updateSchema).then(next);
};

var findSchema = joi.any().required();
validator.id = function(id, next) {
  return validate(id, findSchema).then(next);
};

var postsSchema = joi.object().keys({
  id: joi.any().required(),
  opts: {
    limit: joi.number(),
    startPostId: joi.string()
  }
});
validator.byThread = function(threadId, opts, next) {
  // validation object
  var validationObject = {
    id: threadId,
    opts: opts
  };

  return validate(validationObject, postsSchema)
  .then(function(value) {
    return next(value.id, value.opts);
  });
};

module.exports = validator;