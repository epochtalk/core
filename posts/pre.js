var posts = {};
module.exports = posts;

var bbcodeParser = require('bbcode-parser');

posts.parseBody = function(post) {
  // clear out encodedBody 
  delete post.encodedBody;

  // parse bbcode in body
  if (post.body.indexOf('[') >= 0) {
    var parsedBody = bbcodeParser.process({text: post.body}).html;

    if (parsedBody !== post.body) {
      post.encodedBody = post.body;
      post.body = parsedBody;
    }
  }

  return post;
};
