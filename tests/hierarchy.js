var path = require('path');
var rimraf = require('rimraf');
var should = require('chai').should();
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

var newThread = {};

var newBoard = {
  name: 'new board',
  description: 'new board desc'
};


describe('hierarchy', function() {
  describe('#check', function() {
    it('should check board/thread/post relationship', function() {
      var createdThread;
      var createdBoard;
      var createdPost;
      core.boards.create(newBoard)
      .then(function(board) {
        createdBoard = board;
        var newThread = {
          board_id: createdBoard.id
        };
        core.threads.create(newThread)
        .then(function(thread) {
          createdThread = thread;
          assert.equal(createdThread.board_id, createdBoard.id);
          var newPost = {
            body: 'Test post',
            thread_id: createdThread.id
          };
          core.posts.create(newPost)
          .then(function(post) {
            createdPost = post;
          console.log(newPost);
            assert.equal(createdPost.thread_id, createdThread.id);
          });
        });
      });
    });
  });
  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), function(err) {
      if (err) { console.log(err); }
      done();
    });
  });
});

