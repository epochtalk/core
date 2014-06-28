var posts = require('./posts');

posts.create({id: 1234, body: 'testing 1234'}, function(err) {
  posts.find(1234, function(err, post) {
    console.log(post);
  });
});
