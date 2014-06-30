var posts = require(__dirname + '/../posts');

posts.all(function(err, posts) {
  posts.forEach(function(post) {
    console.log(post.key);
  });
  console.log(posts.length);
});
