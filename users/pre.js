var users = {};
module.exports = users;

var path = require('path');
var bbcodeParser = require('bbcode-parser');
var sanitize = require(path.join('..', 'sanitize'));

users.parseSignature = function(user) {
  // check if signature has any bbcode
  if (user.signature && user.signature.indexOf('[') >= 0) {
    // convert all &lt; and &gt; to decimal to escape the regex
    // in the bbcode parser that'll unescape those chars
    user.signature = user.signature.replace(/&gt;/g, '&#62;');
    user.signature = user.signature.replace(/&lt;/g, '&#60;');

    // parse encodedBody to generate body
    var parsed = bbcodeParser.process({text: user.signature}).html;
    user.signature = parsed;
  }

  return user;
};

users.clean = function(user) {
  if (user.username) { user.username = sanitize.strip(user.username); }
  if (user.email) { user.email = sanitize.strip(user.email); }
  if (user.name) { user.name = sanitize.strip(user.name); }
  if (user.website) { user.website = sanitize.strip(user.website); }
  if (user.btcAddress) { user.btcAddress = sanitize.strip(user.btcAddress); }
  if (user.gender) { user.gender = sanitize.strip(user.gender); }
  if (user.location) { user.location = sanitize.strip(user.location); }
  if (user.language) { user.language = sanitize.strip(user.language); }
  if (user.signature) { user.signature = sanitize.bbcode(user.signature); }
  if (user.avatar) { user.avatar = sanitize.strip(user.avatar); }
  if (user.reset_token) { user.reset_token = sanitize.strip(user.reset_token); }
  if (user.reset_expiration) { user.reset_expiration = sanitize.strip(user.reset_expiration); }
  return user;
};
