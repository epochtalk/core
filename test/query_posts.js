var posts = require(__dirname + '/../posts');

posts.all(function(err, results) {
  results.forEach(function(post) {
    console.log(post);
    posts.find(post.value.id, function(err, post) {
      console.log('--- retrieved:');
      console.log(post);
    });
  });
  console.log(results.length);
});
