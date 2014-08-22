var path = require('path');
var rimraf = require('rimraf');
var chai = require('chai');
var assert = chai.assert;
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

var newPost = {
  body: 'hello world. testing 1234'
};
var createdPost;

describe('posts', function() {
  before(function(done) {
    var newBoard = {
      name: 'Board',
      description: 'Board Desc'
    };
    core.boards.create(newBoard)
    .then(function(board) {
      return { board_id: board.id };
    })
    .then(core.threads.create)
    .then(function(thread) {
      newPost.thread_id = thread.id;
      done();
    });
  });
  describe('#create', function() {
    it('should create a post in the db', function(done) {
      core.posts.create(newPost)
      .then(function(post) {
        assert.property(post, 'created_at');
        assert.property(post, 'updated_at');
        assert.property(post, 'id');
        createdPost = post;
        console.log('created post:');
        console.log(createdPost);
        done();
      });
    });
  });
  describe('#find', function() {
    it('should find a post from the db', function(done) {
      var postIdToFind = createdPost.id;
      core.posts.find(postIdToFind)
      .then(function(post) {
        console.log('found post:');
        console.log(post);
        assert.equal(post.id, createdPost.id);
        assert.equal(post.created_at, createdPost.created_at);
        assert.equal(post.updated_at, createdPost.updated_at);
        assert.equal(post.body, createdPost.body);
        done();
      });
    });
  });
  describe('#delete', function() {
    it('should delete a post from the db', function(done) {
      core.posts.delete(createdPost)
      .then(function(post) {
        console.log('deleted post:');
        console.log(post);
        assert.deepEqual(post, createdPost);
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

