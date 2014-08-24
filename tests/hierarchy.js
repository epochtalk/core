var path = require('path');
var rimraf = require('rimraf');
var should = require('chai').should();
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

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

      return core.boards.create(newBoard)
      .then(function(board) {
        createdBoard = board;
        return { board_id: createdBoard.id };
      })
      .then(core.threads.create)
      .then(function(thread) {
        createdThread = thread;
        createdThread.board_id.should.equal(createdBoard.id);
        return {
          body: 'Test post',
          title: 'Post title',
          thread_id: createdThread.id
        };
      })
      .then(core.posts.create)
      .then(function(post) {
        createdPost = post;
        createdPost.thread_id.should.equal(createdThread.id);
      });
    });
  });
  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

