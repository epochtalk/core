var posts = require(__dirname + '/../posts');
posts.all(function(err, results) {
  results.forEach(function(post) {
    console.log(post.value.id + ':' + post.version);
    console.log(post.value);
  });
});

