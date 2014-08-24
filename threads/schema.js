var schema = {};
module.exports = schema;

var Promise = require('bluebird');
var joi = require('joi');
var validate = Promise.promisify(joi.validate);

var threadSchema = joi.object().keys({
  board_id: joi.string().required(),
  created_at: joi.number(),
  updated_at: joi.number(),
  imported_at: joi.number(),
  id: joi.string(),
  deleted: joi.boolean(),
  smf: {
    thread_id: joi.number()
  }
});

schema.validate = function(thread) {
  return validate(thread, threadSchema);
};

