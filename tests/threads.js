var path = require('path');
var rimraf = require('rimraf');
var chai = require('chai');
var assert = chai.assert;
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

var newThread = {};
var createdThread;

describe('threads', function() {
  describe('#create', function() {
    it('should create a thread in the db', function() {
      core.threads.create(newThread)
      .then(function(thread) {
        assert.property(thread, 'created_at');
        assert.property(thread, 'updated_at');
        assert.property(thread, 'id');
        createdThread = thread;
        console.log('created thread:');
        console.log(createdThread);
      });
    });
  });
  describe('#find', function() {
    it('should find a thread from the db', function() {
      var threadIdToFind = createdThread.id;
      core.threads.find(threadIdToFind)
      .then(function(thread) {
        console.log('found thread:');
        console.log(thread);
        assert.equal(thread.id, createdThread.id);
        assert.equal(thread.created_at, createdThread.created_at);
        assert.equal(thread.updated_at, createdThread.updated_at);
      });
    });
  });
  describe('#delete', function() {
    it('should delete a thread from the db', function() {
      core.threads.delete(createdThread)
      .then(function(thread) {
        console.log('deleted thread:');
        console.log(thread);
        assert.deepEqual(thread, createdThread);
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

