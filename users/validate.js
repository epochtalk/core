var validator = {};
var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var createSchema = joi.object().keys({
  username: joi.string().regex(/[a-zA-Z0-9_\-]/).min(3).max(30).required(),
  email: joi.string().email(),
  password: joi.string().regex(/[a-zA-Z0-9]{3,30}/),
  confirmation: joi.ref('password')
}).with('password', 'confirmation');

validator.create = function(user, next) {
  return validate(user, createSchema).then(next);
};

module.exports = validator;

