var posts = require(__dirname + '/../posts');

var count = 10000;
for (var i = 0; i < count; i++ ) {
  posts.create({body: 'testing 1234'});
}

console.log('creating ' + count + ' posts.');
