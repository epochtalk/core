var posts = require(__dirname + '/../posts');
posts.threads(10, function(err, results) {
  results.forEach(function(thread) {
    console.log(thread);
    posts.forThread(thread.id, function(err, results) {
      console.log(results.length);
    });
  });
});

