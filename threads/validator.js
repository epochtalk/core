var validator = {};
var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var importSchema = joi.object().keys({
  title: joi.string().required(),
  body: joi.string().required(),
  board_id: joi.string().required(),
  created_at: joi.date(),
  smf: {
    thread_id: joi.number(),
    post_id: joi.number()
  }
});
validator.importThread = function(thread, next) {
  return validate(thread, importSchema).then(next);
};


var createSchema = joi.object().keys({
  title: joi.string().required(),
  body: joi.string().required(),
  board_id: joi.string().required()
});
validator.createThread = function(thread, next) {
  return validate(thread, createSchema).then(next);
};


var updateSchema = joi.object().keys({
  id: joi.string(),
  post_count: joi.number(),
  created_at: joi.date(),
  imported_at: joi.date(),
  version: joi.number(),
  smf: {
    thread_id: joi.number(),
    post_id: joi.number()
  }
});
validator.updateThread = function(thread, next) {
  return validate(thread, updateSchema).then(next);
};


var findSchema = joi.any().required();
validator.id = function(id, next) {
  return validate(id, findSchema).then(next);
};


var threadsSchema = joi.object().keys({
  id: joi.any().required(),
  opts: {
    limit: joi.number(),
    startThreadId: joi.string()
  }
});
validator.threads = function(boardId, opts, next) {
  // merge inputs
  var validationObject = {
    id: boardId,
    opts: {
      limit: opts.limit,
      startThreadId: opts.startThreadId
    }
  };

  return validate(validationObject, threadsSchema)
  .then(function(value) {
    return next(value.id, value.opts);
  });
};


module.exports = validator;
