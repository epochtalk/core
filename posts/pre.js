var posts = {};
module.exports = posts;

var path = require('path');
var bbcodeParser = require('bbcode-parser');
var sanitize = require(path.join('..', 'sanitize'));

posts.parseEncodings = function(post) {
  // check if encodedBody has any bbcode
  if (post.encodedBody.indexOf('[') >= 0) {
    // convert all &lt; and &gt; to decimal to escape the regex
    // in the bbcode parser that'll unescape those chars
    post.encodedBody = post.encodedBody.replace(/&gt;/g, '&#62;');
    post.encodedBody = post.encodedBody.replace(/&lt;/g, '&#60;');

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

posts.clean = function(post) {
  post.title = sanitize.strip(post.title);
  post.encodedBody = sanitize.bbcode(post.encodedBody);
  return post;
};
