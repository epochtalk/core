var users = {};
module.exports = users;

var bbcodeParser = require('bbcode-parser');

users.parseSignature = function(user) {
  // check if signature has any bbcode
  if (user.signature && user.signature.indexOf('[') >= 0) {
    // parse encodedBody to generate body
    var parsed = bbcodeParser.process({text: user.signature}).html;
    user.signature = parsed;
  }

  return user;
};
