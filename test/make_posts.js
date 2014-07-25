require(__dirname + '/make_boards');

var posts = require(__dirname + '/../posts');
var boards = require(__dirname + '/../boards');
var threadsCount = 5;
var postsCount = 5;
boards.all(function(err, allBoards) {
  allBoards.forEach(function(board) {
    for (var i = 0; i < threadsCount; i++) {
      posts.create({body: 'Thread testing 1234: ' + i, board_id: board.id}, function(err, post) {
        for (var j = 0; j < postsCount; j++) {
          posts.create({body: 'Post testing 1234: ' + j, thread_id: post.thread_id});
        }
      });
    }
  });
});



console.log('creating ' + postsCount + ' posts for ' + threadsCount + ' threads.');
