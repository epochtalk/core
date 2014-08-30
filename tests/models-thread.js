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
    var plainThread, user;
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
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

  describe('#key', function() {
    var plainThread, user;
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });
    it('should return the thread\'s key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;

      var thread = new Thread(plainThread);
      var key = thread.key();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + thread.id);
    });
  });

  describe('#keyFromId', function() {
    it('should return the thread\'s key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.keyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId);
    });
  });

  describe('#postCountKeyFromId', function() {
    it('should return the thread\'s post count key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.postCountKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId + sep + 'post_count');
    });
  });

  describe('#firstPostIdKeyFromId', function() {
    it('should return the thread\'s first post id key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.firstPostIdKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId + sep + 'first_post_id');
    });
  });

  describe('#titleKeyFromId', function() {
    it('should return the thread\'s title key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.titleKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId + sep + 'title');
    });
  });

  describe('#usernameKeyFromId', function() {
    it('should return the thread\'s username key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.usernameKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId + sep + 'username');
    });
  });

  describe('#legacyKey', function() {
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
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        plainThread.board_id = board.id;
        return plainThread;
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should return the thread\'s legacy key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;

      var newThread = new Thread(plainThread);
      var key = newThread.legacyKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + newThread.smf.thread_id);
    });
  });

  describe('#legacyKeyFromId', function() {
    it('should return the board\'s legacy key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.legacyKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId);
    });
  });

  describe('#postCountKeyFromId', function() {
    it('should return the thread\'s post count key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Thread.postCountKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + fakeId + sep + 'post_count');
    });
  });

  describe('#boardThreadKey', function() {
    var plainThread, user;
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };

    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should return the thread\'s boardThread key', function() {
      var indexPrefix = config.threads.indexPrefix;
      var sep = config.sep;

      var thread = new Thread(plainThread);
      var key = thread.boardThreadKey();

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
      validThread.should.exist;
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

      should.not.exist(simpleThread.key);
      should.not.exist(simpleThread.legacyKey);
      should.not.exist(simpleThread.postCountKey);
      should.not.exist(simpleThread.boardThreadKey);
      should.not.exist(simpleThread.validate);
      should.not.exist(simpleThread.simple);
      should.not.exist(simpleThread.keyFromId);
      should.not.exist(simpleThread.legacyKeyFromId);
      should.not.exist(simpleThread.prefix);
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });

});
