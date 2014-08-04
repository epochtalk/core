var validator = {};
var path = require('path');
var joi = require('joi');
var helper = require(path.join(__dirname, '..', 'helper'));


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
validator.importPost = function(post, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printPost(); }

  // validate post
  joi.validate(post, importSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


var createSchema = joi.object().keys({
  title: joi.string().required(),
  body: joi.string().required(),
  thread_id: joi.string().required(),
  board_id: joi.string()
});
validator.createPost = function(post, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printPost(); }

  // validate post
  joi.validate(post, createSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
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
validator.updatePost = function(post, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printPost(); }

  // validate post
  joi.validate(post, updateSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


validator.callback = function(cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printpost(); }
  return next(cb);
};


var findSchema = joi.any().required();
validator.id = function(id, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printPost(); }

  // validate board
  joi.validate(id, findSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


var postsSchema = joi.object().keys({
  id: joi.any().required(),
  opts: {
    limit: joi.number(),
    startPostId: joi.string()
  }
});
validator.byThread = function(threadId, opts, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printPost(); }

  // validation object
  var validationObject = {
    id: threadId,
    opts: opts
  };

  // validate opts
  joi.validate(validationObject, postsSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(threadId, opts, cb); }
  });
};


module.exports = validator;