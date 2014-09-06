var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
var probe = require(path.join(__dirname, '..', 'probe'));
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);
var threads = core.threads;
var posts = core.posts;
var boards = core.boards;

describe('threads', function() {

  describe('#byBoard', function() {
    // byBoards doesn't work for threads without posts
    var plainThread = {};
    var plainPost = { title: 'plain title', body: 'plain body' };
    var thread1;
    var thread2;
    var boardId;
    var user;

    before(function() {
      var testBoard = {
        name: 'Test Board',
        description: 'Test Board Description'
      };
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create(testBoard);
      })
      .then(function(board) {
        boardId = board.id;
        plainThread.board_id = board.id;
        return;
      })
      .then(function() {
        return threads.create(plainThread)
        .then(function(thread) {
          thread1 = thread;
          plainPost.thread_id = thread.id;
          plainPost.user_id = user.id;
          return posts.create(plainPost);
        });
      })
      .then(function() {
        return threads.create(plainThread)
        .then(function(thread) {
          thread2 = thread;
          plainPost.thread_id = thread.id;
          return posts.create(plainPost);
        });
      });
    });

    it('should return threads for a boardId', function() {
      return threads.byBoard(boardId, { limit: 10 })
      .then(function(allThreads) {
        allThreads.forEach(function(thread) {
          thread.id.should.be.ok;
          thread.id.should.be.a('string');
          thread.created_at.should.be.a('number');
          should.not.exist(thread.imported_at);
          should.not.exist(thread.deleted);
          should.not.exist(thread.smf);
          thread.post_count.should.equal(1);
          thread.title.should.be.ok;
          thread.title.should.be.a('string');
          thread.board_id.should.equal(boardId);
        });
      });
    });

    it('should return 2 boards', function() {
      return threads.byBoard(boardId, { limit: 10 })
      .then(function(allThreads) {
        allThreads.should.have.length(2);
      });
    });
  });

  describe('#create', function() {
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

    it('should create a thread in the db', function() {
      return threads.create(plainThread)
      .then(function(thread) {
        thread.id.should.be.ok;
        thread.id.should.be.a('string');
        thread.created_at.should.be.a('number');
        should.not.exist(thread.imported_at);
        should.not.exist(thread.deleted);
        should.not.exist(thread.smf);
        should.not.exist(thread.post_count); // no post count for create return
        should.not.exist(thread.title); // title not set yet
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#import', function() {
    var plainThread = {
      smf: {
        ID_TOPIC: '112'
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
      .then(threads.import)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should create a thread in the db', function() {
      return threads.import(plainThread)
      .then(function(thread) {
        thread.id.should.be.ok;
        thread.id.should.be.a('string');
        thread.created_at.should.be.a('number');
        thread.imported_at.should.be.a('number');
        should.not.exist(thread.deleted);
        thread.smf.ID_TOPIC.should.equal(plainThread.smf.ID_TOPIC);
        should.not.exist(thread.post_count); // no post count for import return
        should.not.exist(thread.title); // title not set yet
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#import_get', function() {
    var plainThread = {
      smf: {
        ID_TOPIC: '112'
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
      .then(threads.import)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should verify key mapping for imported threads', function() {
      return threads.threadByOldId(plainThread.smf.ID_TOPIC)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.equal(plainThread.created_at);
        thread.imported_at.should.equal(plainThread.imported_at);
        should.not.exist(thread.deleted);
        thread.smf.ID_TOPIC.should.equal(plainThread.smf.ID_TOPIC);
        thread.post_count.should.equal(1);
        thread.title.should.equal(plainPost.title);
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#import_purge', function() {
    // *** you can delete a thread with posts still in it ***
    var catchCalled = false;
    var plainThread = {
      smf: {
        ID_TOPIC: '112'
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
      .then(threads.import)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should delete all imported thread key mappings', function() {
      return threads.purge(plainThread.id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.equal(plainThread.created_at);
        thread.imported_at.should.equal(plainThread.imported_at);
        should.not.exist(thread.deleted);
        thread.smf.ID_TOPIC.should.equal(plainThread.smf.ID_TOPIC);
        should.not.exist(thread.post_count); // no post count for delete return
        should.not.exist(thread.title); // no title for delete return
        thread.board_id.should.equal(plainThread.board_id);
        return thread.smf.ID_TOPIC;
      })
      .then(threads.threadByOldId)
      .catch(function(err) {
        catchCalled = true;
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
      })
      .then(function() {
        catchCalled.should.be.true;
      });
    });
  });

  describe('#find', function() {
    // *** find doesn't work if no posts exists for given thread ***
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

    it('should find a thread from the db', function() {
      return threads.find(plainThread.id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.be.equal(plainThread.created_at);
        thread.user.should.be.ok;
        thread.user.username.should.equal('test_user');
        should.not.exist(thread.imported_at);
        should.not.exist(thread.deleted);
        should.not.exist(thread.smf);
        thread.post_count.should.equal(1);
        thread.title.should.equal(plainPost.title);
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#delete', function() {
    // *** you can delete a thread with posts still in it ***
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
        plainPost.user_id =  user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should delete a thread from the db', function() {
      return threads.delete(plainThread.id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.be.equal(plainThread.created_at);
        should.not.exist(thread.imported_at);
        thread.deleted.should.be.true;
        should.not.exist(thread.smf);
        should.not.exist(thread.post_count); // no post count for delete return
        should.not.exist(thread.title); // no title for delete return
        thread.board_id.should.equal(plainThread.board_id);
        return thread.id;
      })
      .then(threads.find)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.be.equal(plainThread.created_at);
        thread.user.should.be.ok;
        thread.user.username.should.equal('test_user');
        should.not.exist(thread.imported_at);
        thread.deleted.should.be.true;
        should.not.exist(thread.smf);
        thread.post_count.should.equal(1);
        thread.title.should.equal(plainPost.title);
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#undelete', function() {
    // *** you can delete a thread with posts still in it ***
    var plainThread, user;
    var plainPost = { title: 'post title', body: 'post body' };

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
      .then(function(post) { plainPost = post; })
      .then(function() {
        return threads.delete(plainThread.id)
        .then(function(thread) { plainThread = thread; });
      });
    });

    it('should undelete specified thread', function() {
      plainThread.deleted = false;
      return threads.update(plainThread)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.be.equal(plainThread.created_at);
        should.not.exist(thread.imported_at);
        should.not.exist(thread.deleted);
        should.not.exist(thread.smf);
        should.not.exist(thread.post_count); // no post count for delete return
        should.not.exist(thread.title); // no title for delete return
        thread.board_id.should.equal(plainThread.board_id);
        return thread.id;
      })
      .then(threads.find)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.be.equal(plainThread.created_at);
        thread.user.should.be.ok;
        thread.user.username.should.equal('test_user');
        should.not.exist(thread.imported_at);
        should.not.exist(thread.deleted);
        should.not.exist(thread.smf);
        thread.post_count.should.equal(1);
        thread.title.should.equal(plainPost.title);
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#purge', function() {
    // *** you can delete a thread with posts still in it ***
    var catchCalled = false;
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

    it('should purge a thread from the db', function() {
      return threads.purge(plainThread.id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.equal(plainThread.created_at);
        should.not.exist(thread.imported_at);
        should.not.exist(thread.deleted);
        should.not.exist(thread.smf);
        should.not.exist(thread.post_count); // no post count for delete return
        should.not.exist(thread.title); // no title for delete return
        thread.board_id.should.equal(plainThread.board_id);
        return thread.id;
      })
      .then(threads.find)
      .catch(function(err) {
        catchCalled = true;
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
      })
      .then(function() {
        catchCalled.should.be.true;
      });
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

