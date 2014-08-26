var rimraf = require('rimraf');
var should = require('chai').should();
var dbName = 'test-epoch.db';
var path = require('path');
var core = require(path.join(__dirname, '..'))(dbName);
var threads = core.threads;
var boards = core.boards;
var posts = core.posts;
var Thread = require(path.join(__dirname, '..', 'threads', 'model'));
var config = require(path.join(__dirname, '..', 'config'));

describe('Thread', function() {

  describe('#new', function() {
    var plainThread;
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newBoard = { name: 'Board', description: 'Board Desc' };
      return boards.create(newBoard)
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should create a plain thread object', function() {
      var thread = new Thread(plainThread);
      thread.id.should.equal(plainThread.id);
      thread.created_at.should.be.a('number');
      thread.updated_at.should.be.a('number');
      should.not.exist(thread.imported_at);
      should.not.exist(thread.deleted);
      should.not.exist(thread.smf);
      should.not.exist(thread.post_count); // no post count for create return
      should.not.exist(thread.title); // title not set yet
      thread.board_id.should.equal(plainThread.board_id);
    });
  });

  describe('#getKey', function() {
    var plainThread;
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newBoard = { name: 'Board', description: 'Board Desc' };
      return boards.create(newBoard)
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });
    it('should return the thread\'s key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;

      var thread = new Thread(plainThread);
      var key = thread.getKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + thread.id);
    });
  });

  describe('#getKeyFromId', function() {
    it('should return the thread\'s legacy key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.getKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId);
    });
  });

  describe('#getLegacyKey', function() {
    var plainThread = {
      smf: {
        thread_id: '0123456789',
        post_id: '9876543210'
      }
    };
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newBoard = { name: 'Board', description: 'Board Desc' };
      return boards.create(newBoard)
      .then(function(board) {
        plainThread.board_id = board.id;
        return plainThread;
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should return the board\'s legacy key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;

      var newThread = new Thread(plainThread);
      var key = newThread.getLegacyKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + newThread.smf.thread_id);
    });
  });

  describe('#getLegacyKeyFromId', function() {
    it('should return the board\'s legacy key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.getLegacyKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId);
    });
  });

  describe('#getPostCountKey', function() {
    var plainThread;
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newBoard = { name: 'Board', description: 'Board Desc' };
      return boards.create(newBoard)
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should return the board\'s postCount key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var postCount = 'post_count';

      var thread = new Thread(plainThread);
      var key = thread.getPostCountKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + thread.id + sep + postCount);
    });
  });

  describe('#getBoardThreadKey', function() {
    var plainThread;
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newBoard = { name: 'Board', description: 'Board Desc' };
      return boards.create(newBoard)
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should return the board\'s boardThread key', function() {
      var indexPrefix = config.threads.indexPrefix;
      var sep = config.sep;

      var thread = new Thread(plainThread);
      var key = thread.getBoardThreadKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(indexPrefix + sep + thread.board_id + sep + thread.id);
    });
  });

  describe('#validate', function() {

    it('should validate the minimum thread model', function() {
      var minThread = { board_id: 'test_board_id' };
      var thread = new Thread(minThread);
      var validThread = thread.validate().value();
      validThread.should.exist;
    });

    it('should validate that board_id is required', function() {
      var boardIdThread = { };
      var thread = new Thread(boardIdThread);
      return thread.validate()
      .catch(function(err) {
        err.should.exist;
      });
    });

    it('should validate dates are numbers', function() {
      var dateThread = {
        board_id: 'test_board_id',
        created_at: 12312312,
        updated_at: 13124121,
        imported_at: 12314124
      };
      var thread = new Thread(dateThread);
      var validThread = thread.validate().value();
    });

    it('should validate ids are string', function() {
      var idThread = {
        board_id: 'test_board_id',
        id: '121314'
      };
      var thread = new Thread(idThread);
      var validThread = thread.validate().value();
      validThread.should.exist;
    });

    it('should validate deleted is a boolean', function() {
      var deletedThread = {
        board_id: 'test_board_id',
        deleted: true
      };
      var thread = new Thread(deletedThread);
      var validThread = thread.validate().value();
      validThread.should.exist;
    });

    it('should validate smf id is a number', function() {
      var smfThread = {
        board_id: 'test_board_id',
        smf: {
          thread_id: 1235,
          post_id: 2342
        }
      };
      var thread = new Thread(smfThread);
      var validThread = thread.validate().value();
      validThread.should.exist;
    });
  });

  describe('#simple', function() {
    var fullThread = {
      id: 'asdflkalskdfa',
      board_id: 'test_board_id',
      created_at: 212424525,
      updated_at: 342523422,
      imported_at: 2323424234,
      deleted: true,
      smf: {
        thread_id: 234235,
        post_id: 223242
      }
    };

    it('should return a simple version of the thread', function() {
      var thread = new Thread(fullThread);
      var simpleThread = thread.simple();
      simpleThread.id.should.equal(fullThread.id);
      simpleThread.board_id.should.equal(fullThread.board_id);
      simpleThread.created_at.should.equal(fullThread.created_at);
      simpleThread.updated_at.should.equal(fullThread.updated_at);
      simpleThread.imported_at.should.equal(fullThread.imported_at);
      simpleThread.deleted.should.be.true;
      simpleThread.smf.thread_id.should.equal(fullThread.smf.thread_id);

      should.not.exist(simpleThread.getKey);
      should.not.exist(simpleThread.getLegacyKey);
      should.not.exist(simpleThread.getPostCountKey);
      should.not.exist(simpleThread.getBoardThreadKey);
      should.not.exist(simpleThread.validate);
      should.not.exist(simpleThread.simple);
      should.not.exist(simpleThread.getKeyFromId);
      should.not.exist(simpleThread.getLegacyKeyFromId);
      should.not.exist(simpleThread.prefix);
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });

});
