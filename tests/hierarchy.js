var path = require('path');
var rimraf = require('rimraf');
var chai = require('chai');
var assert = chai.assert;
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

var newThread = {
  board_id: 'board_id_test'
};

var createdThread;

describe('hierarchy', function() {
  before(function() {
    core.threads.create(newThread)
    .then(function(thread) {
      createdThread = thread;
    });
  });

  describe('#create', function() {
    it('should create a board/thread/post in the db', function() {
      core.threads.create(newThread)
      .then(function(thread) {
        assert.property(thread, 'created_at');
        assert.property(thread, 'updated_at');
        assert.property(thread, 'id');
        assert.equal(thread.board_id, newThread.board_id);
      })
      .catch(function() {
        fail('Unable to create.');
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

