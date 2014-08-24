var path = require('path');
var rimraf = require('rimraf');
var chai = require('chai');
var assert = chai.assert;
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

var newThread = {
  board_id: 'board_id_test'
};

var newPost = {
  title: 'post title',
  body: 'post body'
};

var createdThread;

describe('threads', function() {
  before(function(done) {
    core.threads.create(newThread)
    .then(function(thread) {
      createdThread = thread;
      newPost.thread_id = thread.id;
      return core.posts.create(newPost);
    })
    .then(function() { done(); });
  });

  describe('#create', function() {
    it('should create a thread in the db', function(done) {
      core.threads.create(newThread)
      .then(function(thread) {
        assert.property(thread, 'created_at');
        assert.property(thread, 'updated_at');
        assert.property(thread, 'id');
        assert.equal(thread.board_id, newThread.board_id);
        done();
      })
      .catch(function() {
        done('Unable to create thread.');
      });
    });
  });
  describe('#find', function() {
    it('should find a thread from the db', function(done) {
      var threadIdToFind = createdThread.id;
      core.threads.find(threadIdToFind)
      .then(function(thread) {
        assert.equal(thread.id, createdThread.id);
        assert.equal(thread.created_at, createdThread.created_at);
        assert.equal(thread.updated_at, createdThread.updated_at);
        done();
      });
    });
  });
  describe('#delete', function() {
    it('should delete a thread from the db', function(done) {
      core.threads.delete(createdThread)
      .then(function(thread) {
        assert.deepEqual(thread, createdThread);
        done();
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

