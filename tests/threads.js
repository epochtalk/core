var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
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

    before(function() {
      var testBoard = {
        name: 'Test Board',
        description: 'Test Board Description'
      };

      return boards.create(testBoard)
      .then(function(board) {
        boardId = board.id;
        plainThread.board_id = board.id;
      })
      .then(function(board) {
        return threads.create(plainThread)
        .then(function(thread) {
          thread1 = thread;
          plainPost.thread_id = thread.id;
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
          thread.updated_at.should.be.a('number');
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

    it('should create a thread in the db', function() {
      return threads.create(plainThread)
      .then(function(thread) {
        thread.id.should.be.ok;
        thread.id.should.be.a('string');
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
  });

  describe('#import', function() {
    var plainThread = {
      smf: {
        thread_id: '112'
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

    it('should create a thread in the db', function() {
      return threads.import(plainThread)
      .then(function(thread) {
        thread.id.should.be.ok;
        thread.id.should.be.a('string');
        thread.created_at.should.be.a('number');
        thread.updated_at.should.be.a('number');
        thread.imported_at.should.be.a('number');
        should.not.exist(thread.deleted);
        thread.smf.thread_id.should.equal(plainThread.smf.thread_id);
        should.not.exist(thread.post_count); // no post count for import return
        should.not.exist(thread.title); // title not set yet
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#import_get', function() {
    var plainThread = {
      smf: {
        thread_id: '112'
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
      .then(threads.import)
      .then(function(thread) {
        plainThread = thread;
        plainPost.thread_id = thread.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; });
    });

    it('should verify key mapping for imported threads', function() {
      return threads.threadByOldId(plainThread.smf.thread_id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.equal(plainThread.created_at);
        thread.updated_at.should.equal(plainThread.updated_at);
        thread.imported_at.should.equal(plainThread.imported_at);
        should.not.exist(thread.deleted);
        thread.smf.thread_id.should.equal(plainThread.smf.thread_id);
        thread.post_count.should.equal(1);
        thread.title.should.equal(plainPost.title);
        thread.board_id.should.equal(plainThread.board_id);
      });
    });
  });

  describe('#import_delete', function() {
    // *** you can delete a thread with posts still in it ***
    var plainThread = {
      smf: {
        thread_id: '112'
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

    it('should delete all imported thread key mappings', function() {
      return threads.delete(plainThread.id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.equal(plainThread.created_at);
        thread.updated_at.should.equal(plainThread.updated_at);
        thread.imported_at.should.equal(plainThread.imported_at);
        should.not.exist(thread.deleted);
        thread.smf.thread_id.should.equal(plainThread.smf.thread_id);
        should.not.exist(thread.post_count); // no post count for delete return
        should.not.exist(thread.title); // no title for delete return
        thread.board_id.should.equal(plainThread.board_id);
        return thread.smf.thread_id;
      })
      .then(threads.threadByOldId)
      .catch(function(err) {
        err.should.not.be.null;
      });
    });
  });

  describe('#find', function() {
    // *** find doesn't work if no posts exists for given thread ***
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

    it('should find a thread from the db', function() {
      return threads.find(plainThread.id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.be.equal(plainThread.created_at);
        thread.updated_at.should.be.equal(plainThread.updated_at);
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

    it('should delete a thread from the db', function() {
      return threads.delete(plainThread.id)
      .then(function(thread) {
        thread.id.should.equal(plainThread.id);
        thread.created_at.should.equal(plainThread.created_at);
        thread.updated_at.should.equal(plainThread.updated_at);
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
        err.should.not.be.null;
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

