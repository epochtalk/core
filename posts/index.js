var posts = {};
module.exports = posts;
var path = require('path');
var postsDb = require(path.join(__dirname, 'db'));
var Post = require(path.join(__dirname, 'model'));

posts.create = function(data) {
  var newPost = new Post(data);
  postsDb.insert(newPost)
  .then(function(post) {
    console.log(post);
  });
}
