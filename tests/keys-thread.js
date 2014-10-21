var rimraf = require('rimraf');
var should = require('chai').should();
var path = require('path');
var dbName = '.testDB';
var probe = require(path.join(__dirname, '..', 'probe'));
var Thread = require(path.join(__dirname, '..', 'threads', 'keys'));
var config = require(path.join(__dirname, '..', 'config'));
var dbHelper = require(path.join(__dirname, '..', 'db', 'helper'));
var encodeIntHex = dbHelper.encodeIntHex;

describe('Thread', function() {
  var thread = { id: '132ladf', board_id: 'asdf' };
  var threadPrefix = config.threads.prefix;
  var indexPrefix = config.threads.indexPrefix;
  var sep = config.sep;

  describe('#key', function() {
    it('should return the thread\'s key', function() {
      var key = Thread.key(thread.id);
      var check = threadPrefix + sep + thread.id;
      key.should.be.equal(check);
    });
  });

  describe('#legacyKey', function() {
    it('should return the board\'s legacy key', function() {
      var id = 1234;
      var key = Thread.legacyKey(id);
      var check = threadPrefix + sep + id;
      key.should.be.equal(check);
    });
  });

  describe('#boardThreadKey', function() {
    it('should return the thread\'s boardThread key', function() {
      var timestamp = 289793842345;
      var key = Thread.boardThreadKey(thread.id, thread.board_id, timestamp);
      var check = indexPrefix + sep + thread.board_id + sep + timestamp + sep + thread.id;
      key.should.be.equal(check);
    });
  });

  describe('#postCountKey', function() {
    it('should return the thread\'s post count key', function() {
      var key = Thread.postCountKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'post_count';
      key.should.be.equal(check);
    });
  });

  describe('#firstPostIdKey', function() {
    it('should return the thread\'s first post id key', function() {
      var key = Thread.firstPostIdKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'first_post_id';
      key.should.be.equal(check);
    });
  });

  describe('#titleKey', function() {
    it('should return the thread\'s title key', function() {
      var key = Thread.titleKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'title';
      key.should.be.equal(check);
    });
  });

  describe('#usernameKey', function() {
    it('should return the thread\'s username key', function() {
      var key = Thread.usernameKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'username';
      key.should.be.equal(check);
    });
  });

  describe('#lastPostUsernamekey', function() {
    it('should return the thread\'s last post username key', function() {
      var key = Thread.lastPostUsernameKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'last_post_username';
      key.should.be.equal(check);
    });
  });

  describe('#lastPostCreatedAtKey', function() {
    it('should return the thread\'s last post created at key', function() {
      var key = Thread.lastPostCreatedAtKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'last_post_created_at';
      key.should.be.equal(check);
    });
  });

  describe('#viewCountKey', function() {
    it('should return the thread\'s view count key', function() {
      var key = Thread.viewCountKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'view_count';
      key.should.be.equal(check);
    });
  });

  describe('#threadOrderKey', function() {
    it('should return the thread\'s thread order key', function() {
      var key = Thread.threadOrderKey(thread.id);
      var check = threadPrefix + sep + thread.id + sep + 'thread_order';
      key.should.be.equal(check);
    });
  });

  describe('#boardThreadOrderKey', function() {
    it('should return the thread\'s board thread order key', function() {
      var boardId = 'adsfalksf';
      var order = 21;
      var encodedOrder = encodeIntHex(21);
      var key = Thread.boardThreadOrderKey(boardId, order);
      var check = indexPrefix + sep + boardId + sep + 'order' + sep + encodedOrder;
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
