var schema = {};
module.exports = schema;

var joi = require('joi');
var Promise = require('bluebird');
var validate = Promise.promisify(joi.validate);

var threadSchema = joi.object().keys({
  id: joi.string(),
  board_id: joi.string().required(),
  created_at: joi.number(),
  imported_at: joi.number(),
  deleted: joi.boolean(),
  smf: {
    ID_MEMBER: joi.number(),
    ID_TOPIC: joi.number(),
    ID_FIRST_MSG: joi.number()
  }
});

schema.validate = function(thread) {
  return validate(thread, threadSchema);
};

