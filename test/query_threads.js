var posts = require(__dirname + '/../posts');
posts.starters(function(err, results) {
  results.forEach(function(post) {
    console.log(post);
  });
});

