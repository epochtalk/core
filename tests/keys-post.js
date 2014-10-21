var rimraf = require('rimraf');
var should = require('chai').should();
var path = require('path');
var dbName = '.testDB';
var probe = require(path.join(__dirname, '..', 'probe'));
var pre = require(path.join(__dirname, '..', 'posts', 'pre'));
var Post = require(path.join(__dirname, '..', 'posts', 'keys'));
var config = require(path.join(__dirname, '..', 'config'));
var dbHelper = require(path.join(__dirname, '..', 'db', 'helper'));
var encodeIntHex = dbHelper.encodeIntHex;

describe('Post', function() {
  var postPrefix = config.posts.prefix;
  var indexPrefix = config.posts.indexPrefix;
  var sep = config.sep;
  var post = { id: 'asdfa', thread_id: 'alkjadsf' };

  describe('#ParseBody', function() {
    var plainPost = { title: 'post title', body: '[b]hello world.[/b]' };

    it('should populate the encodedBody property', function() {
      var parsedPost = pre.parseBody(plainPost);
      parsedPost.encodedBody.should.equal('[b]hello world.[/b]');
      parsedPost.body.should.equal('<b>hello world.</b>');
    });
  });
  
  describe('#key', function() {
    it('should return the post\'s key', function() {
      var key = Post.key(post.id);
      var check = postPrefix + sep + post.id;
      key.should.be.equal(check);
    });
  });

  describe('#legacyKey', function() {
    it('should return the post\'s legacy key', function() {
      var id = 123;
      var key = Post.legacyKey(id);
      var check = postPrefix + sep + id;
      key.should.be.equal(check);
    });
  });

  describe('#threadPostOrderKey', function() {
    it('should return the post\'s thread post order key', function() {
      var threadId = 'qakjlak';
      var count = 12;
      var encodedCount = encodeIntHex(count);
      var key = Post.threadPostOrderKey(threadId, count);
      var check = indexPrefix + sep + threadId + sep + encodedCount;
      key.should.be.equal(check);
    });
  });

  describe('#versionKey', function() {
    it('should return the post\'s version key', function() {
      var timestamp = 123412538;
      var key = Post.versionKey(post.id, timestamp);
      var check = config.posts.version + sep + post.id + sep + timestamp;
      key.should.be.equal(check);
    });
  });

  describe('#usernameKey', function() {
    it('should return the post\'s username key', function() {
      var key = Post.usernameKey(post.id);
      var check = postPrefix + sep + post.id + sep + 'username';
      key.should.be.equal(check);
    });
  });

  describe('#postOrderKey', function() {
    it('should return the post\'s order key', function() {
      var key = Post.postOrderKey(post.id);
      var check = postPrefix + sep + post.id + sep + 'post_order';
      key.should.be.equal(check);
    });
  });

  describe('#CLEANING', function() {
    it('cleaning all db', function() {
      return probe.clean();
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });

});
