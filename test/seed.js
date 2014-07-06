var users = require(__dirname + '/../users');
var boards = require(__dirname + '/../boards');
var posts = require(__dirname + '/../posts');
var Charlatan = require('charlatan');
var async = require('async');
var seed = {};

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
var generatePost = function() {
  var words = Charlatan.Lorem.words(Charlatan.Helpers.rand(8, 1));
  words[0] = Charlatan.Helpers.capitalize(words[0]);
  var subject = words.join(' ');
  var paragraphCount = Charlatan.Helpers.rand(10, 1);
  var body = Charlatan.Lorem.text(paragraphCount, false, '<br /><br />');
  var createdDate = randomDate(new Date(2012, 0, 1), new Date());
  var timestamps = {
    created: createdDate.getTime(),
    updated: Charlatan.Helpers.rand(10, 0) > 8 ? randomDate(createdDate, new Date()).getTime() : null
  };
  var post = {
    subject: subject,
    body: body,
    timestamps: timestamps,
  };
  return post;
};

var postsCount = 100;
for (var i = 0; i < postsCount; i++) {
  posts.create(generatePost(), function(err, post) {
    console.log(post.id + ':' + post.version);
  });
}
