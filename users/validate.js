var validator = {};
var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var createSchema = joi.object().keys({
  username: joi.string().regex(/[a-zA-Z0-9_\-]/).min(2).max(30).required(),
  email: joi.string().email().required(),
  password: joi.string().regex(/[a-zA-Z0-9]{3,30}/).required(),
  confirmation: joi.ref('password'),
  smf: {
    ID_MEMBER: joi.number()
  }
}).with('password', 'confirmation');

validator.create = function(user) {
  return validate(user, createSchema);
};

var importSchema = joi.object().keys({
  username: joi.string().required(),
  email: joi.string(),
  created_at: joi.number(),
  smf: {
    ID_MEMBER: joi.number().required()
  }
}).with('password', 'confirmation');

validator.import = function(user) {
  return validate(user, importSchema);
};

var updateSchema = joi.object().keys({
  id: joi.string(),
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  deleted: joi.boolean(),
  username: joi.string(),
  email: joi.string(),
  password: joi.string().regex(/[a-zA-Z0-9]{3,30}/),
  confirmation: joi.ref('password'),
  passhash: joi.string(),
  smf: {
    ID_MEMBER: joi.number()
  }
}).with('password', 'confirmation');

validator.update = function(user) {
  return validate(user, updateSchema);
};

module.exports = validator;

