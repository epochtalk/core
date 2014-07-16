var posts = require(__dirname + '/../posts');
posts.threads(1, function(err, results) {
  results.forEach(function(thread) {
    console.log(thread);
    posts.forThread(thread.id, { startPostId: '1405522256810~97ea60bc-0cf8-11e4-a14c-c30f8d6e3554' }, function(err, results) {
      console.log(results);
    });
  });
});

