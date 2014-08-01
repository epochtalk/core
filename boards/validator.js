var validator = {};
var path = require('path');
var joi = require('joi');
var helper = require(path.join(__dirname, '..', 'helper'));


var importSchema = joi.object().keys({
  name: joi.string().required(),
  description: joi.string(),
  created_at: joi.date().default(Date.now()),
  smf: {
    board_id: joi.number()
  }
});
validator.importBoard = function(board, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printBoard(); }

  // validate board
  joi.validate(board, importSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


var createSchema = joi.object().keys({
  name: joi.string().required(),
  description: joi.string()
});
validator.createBoard = function(board, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printBoard(); }

  // validate board
  joi.validate(board, createSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


var updateSchema = joi.object().keys({
  id: joi.string(),
  name: joi.string(),
  description: joi.string(),
  created_at: joi.date(),
  imported_at: joi.date(),
  version: joi.number(),
  smf: {
    board_id: joi.number()
  }
});
validator.updateBoard = function(board, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printBoard(); }

  // validate board
  joi.validate(board, updateSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};


validator.callback = function(cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printBoard(); }
  return next(cb);
};


var findSchema = joi.any().required();
validator.id = function(id, cb, next) {
  // validate cb 
  if (cb === undefined) { cb = helper.printBoard(); }

  // validate board
  joi.validate(id, findSchema, function(err, value) {
    if (err) { return cb(err, undefined); }
    else { return next(value, cb); }
  });
};

module.exports = validator;