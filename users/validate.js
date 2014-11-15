var validator = {};
module.exports = validator;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var createSchema = joi.object().keys({
  username: joi.string().regex(/[a-zA-Z0-9_\-]/).min(2).required(),
  email: joi.string().email().required(),
  password: joi.string().regex(/[a-zA-Z0-9]{3,30}/).required(),
  confirmation_token: joi.string().token()
});
validator.create = function(user) {
  return validate(user, createSchema, { stripUnknown: true });
};

var importSchema = joi.object().keys({
  username: joi.string().required(),
  email: joi.string(), // should be required?
  created_at: joi.number(),
  updated_at: joi.number(),
  name: joi.string(),
  website: joi.string(),
  btcAddress: joi.string(),
  gender: joi.string(),
  dob: joi.number(),
  location: joi.string(),
  language: joi.string(),
  signature: joi.string(),
  avatar: joi.string(), // url
  smf: {
    ID_MEMBER: joi.number().required()
  }
}).with('password', 'confirmation');
validator.import = function(user) {
  return validate(user, importSchema);
};

var updateSchema = joi.object().keys({
  id: joi.string().required(),
  username: joi.string(),
  email: joi.string(),
  password: joi.string(),
  confirmation: joi.ref('password'),
  name: joi.string(),
  website: joi.string(),
  btcAddress: joi.string(),
  gender: joi.string(),
  dob: joi.number(),
  location: joi.string(),
  language: joi.string(),
  signature: joi.string(),
  avatar: joi.string(), // url
  reset_token: joi.string(),
  reset_expiration: joi.number()
}).with('password', 'confirmation');
validator.update = function(user) {
  return validate(user, updateSchema, { stripUnknown: true });
};

var idSchema = joi.string().min(1);
validator.id = function(id) {
  return validate(id, idSchema);
};

var numIdSchema = joi.number().min(1);
validator.numId = function(numId) {
  return validate(numId, numIdSchema);
};

var usernameSchema = joi.string();
validator.username = function(username) {
  return validate(username, usernameSchema);
};

var emailSchema = joi.string();
validator.email = function(email) {
  return validate(email, emailSchema);
};

// userId and (userId, userViewsArray)
