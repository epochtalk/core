var validator = {};
var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var createSchema = joi.object().keys({
  username: joi.string().regex(/[a-zA-Z0-9_\-]/).min(2).max(30).required(),
  email: joi.string().email(),
  password: joi.string().regex(/[a-zA-Z0-9]{3,30}/),
  confirmation: joi.ref('password'),
  smf: {
    ID_MEMBER: joi.number()
  }
}).with('password', 'confirmation');

validator.create = function(user, next) {
  return validate(user, createSchema).then(next);
};

var importSchema = joi.object().keys({
  username: joi.string().regex(/[a-zA-Z0-9_\-]/).min(2).max(30).required(),
  email: joi.string(),
  password: joi.string().regex(/[a-zA-Z0-9]{3,30}/),
  confirmation: joi.ref('password'),
  smf: {
    ID_MEMBER: joi.number()
  }
}).with('password', 'confirmation');

validator.import = function(user, next) {
  return validate(user, importSchema).then(next);
};

module.exports = validator;

