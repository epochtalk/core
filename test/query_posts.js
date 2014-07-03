var posts = require(__dirname + '/../posts');

posts.all(function(err, results) {
  results.forEach(function(post) {
    posts.find(post.value.id, function(err, post) {
      console.log(post.id);
    });
  });
});
