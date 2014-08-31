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
  email: joi.string().required(),
  password: joi.string().regex(/[a-zA-Z0-9]{3,30}/).required(),
  confirmation: joi.ref('password'),
  smf: {
    ID_MEMBER: joi.number().required()
  }
}).with('password', 'confirmation');

validator.import = function(user) {
  return validate(user, importSchema);
};

module.exports = validator;

