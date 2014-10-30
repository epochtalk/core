var posts = {};
module.exports = posts;

var bbcodeParser = require('bbcode-parser');

posts.parseEncodings = function(post) {
  // check if encodedBody has any bbcode
  if (post.encodedBody.indexOf('[') >= 0) {
    // parse encodedBody to generate body
    var parsedBody = bbcodeParser.process({text: post.encodedBody}).html;
    post.body = parsedBody;

    // check if parsing was needed
    if (parsedBody === post.encodedBody) {
      // it wasn't need so remove encodedBody
      post.encodedBody = null;
    }
  }
  else {
    // nothing to parse, just move encodedBody to body
    post.body = post.encodedBody;
    post.encodedBody = null;
  }

  return post;
};
