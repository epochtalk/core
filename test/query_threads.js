var posts = require(__dirname + '/../posts');
posts.threads(function(err, results) {
  results.forEach(function(thread) {
    console.log(thread);
    posts.forThread(thread.id, function(err, results) {
      console.log(results.length);
    });
  });
});

