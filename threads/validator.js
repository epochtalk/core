var validator = {};
var path = require('path');
var joi = require('joi');
var helper = require(path.join(__dirname, '..', 'helper'));


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
validator.importThread = function(thread, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printThread(); }

  // validate thread
  joi.validate(thread, importSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


var createSchema = joi.object().keys({
  title: joi.string().required(),
  body: joi.string().required(),
  board_id: joi.string().required()
});
validator.createThread = function(thread, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printThread(); }

  // validate thread
  joi.validate(thread, createSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
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
validator.updateThread = function(thread, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printThread(); }

  // validate thread
  joi.validate(thread, updateSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


validator.callback = function(cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printThread(); }
  return next(cb);
};


var findSchema = joi.any().required();
validator.id = function(id, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printThread(); }

  // validate board
  joi.validate(id, findSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


var threadsSchema = joi.object().keys({
  id: joi.any().required(),
  opts: {
    limit: joi.number(),
    startThreadId: joi.string()
  }
});
validator.threads = function(boardId, opts, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printThread(); }

  // validation object
  var validationObject = {
    id: boardId,
    opts: opts
  };

  // validate opts
  joi.validate(validationObject, threadsSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(boardId, opts, cb); }
  });
};


module.exports = validator;
