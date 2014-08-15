var path = require('path');
var rimraf = require('rimraf');
var chai = require('chai');
var assert = chai.assert;
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

var newPost = {
  body: 'hello world. testing 1234',
}
var createdPost;

describe('posts', function() {
  describe('#create', function() {
    it('should create a post object into the db', function() {
      core.posts.create(newPost)
      .then(function(post) {
        assert.property(post, 'created_at');
        assert.property(post, 'updated_at');
        assert.property(post, 'id');
        createdPost = post;
        console.log('created post:');
        console.log(createdPost);
      });
    });
  });
  describe('#delete', function() {
    it('should delete a post object from the db', function() {
      core.posts.delete(createdPost)
      .then(function(post) {
        console.log('deleted post:');
        console.log(post);
        assert.deepEqual(post, createdPost);
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

