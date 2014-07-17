var posts = require(__dirname + '/../posts');

var threadsCount = 100;
var postsCount = 10000;
for (var i = 0; i < threadsCount; i++) {
  posts.create({body: 'Thread testing 1234: ' + i}, function(err, post) {
    for (var j = 0; j < postsCount; j++) {
      posts.create({body: 'Post testing 1234: ' + j, thread_id: post.thread_id});
    }
  });
}

console.log('creating ' + postsCount + ' posts for ' + threadsCount + ' threads.');
