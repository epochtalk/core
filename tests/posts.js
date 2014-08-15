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
    it('should create a post in the db', function() {
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
  describe('#find', function() {
    it('should find a post from the db', function() {
      var postIdToFind = createdPost.id;
      core.posts.find(postIdToFind)
      .then(function(post) {
        console.log('found post:');
        console.log(post);
        assert.equal(post.id, createdPost.id);
        assert.equal(post.created_at, createdPost.created_at);
        assert.equal(post.updated_at, createdPost.updated_at);
        assert.equal(post.body, createdPost.body);
      });
    });
  });
  describe('#delete', function() {
    it('should delete a post from the db', function() {
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

