var path = require('path');
var rimraf = require('rimraf');
var chai = require('chai');
var assert = chai.assert;
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

