var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
var Promise = require('bluebird');
var dbName = '.testDB';
var config = require(path.join(__dirname, '..', 'config'));
var core = require(path.join(__dirname, '..'))(dbName);
var boards = core.boards;
var threads = core.threads;
var posts = core.posts;
var users = core.users;
var probe = require(path.join(__dirname, '..', 'probe'))(core.engine);

var CONTENT = 'content';
var INDEXES = 'indexes';
var METADATA = 'metadata';
var DELETED = 'deleted';
var LEGACY = 'legacy';
var MESSAGES = 'messages';

describe('DB', function() {
  describe('#purge', function() {

    it('should purge content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should purge indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should purge metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should purge deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        return Promise.map(deleted, function(data) {
          return probe.del(DELETED, data.key);
        });
      });
    });

    it('should purge legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        return Promise.map(legacy, function(data) {
          return probe.del(LEGACY, data.key);
        });
      });
    });

    it('should purge messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        return Promise.map(messages, function(data) {
          return probe.del(MESSAGES, data.key);
        });
      });
    });
  });
});

describe('boards', function() {

  describe('#create', function() {
    var testBoard = { name: 'Board', description: 'Description' };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { testBoard = board; });
    });

    it('should have 1 board in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board
        content.should.have.length(1);
        return probe.del(CONTENT, content[0].key);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have 8 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // last post created at
        // last post username
        // last thread id
        // last thread title
        // post count
        // thread count
        // total post count
        // total thread count
        metadata.should.have.length(8);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import', function() {
    var testBoard = {
      name: 'Board',
      description: 'Description',
      smf: {
        ID_BOARD: '123'
      }
    };

    before(function() {
      return boards.import(testBoard)
      .then(function(board) { testBoard = board; });
    });

    it('should have 1 board in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board
        content.should.have.length(1);
        return probe.del(CONTENT, content[0].key);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have 8 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // last post created at
        // last post username
        // last thread id
        // last thread title
        // post count
        // thread count
        // total post count
        // total thread count
        metadata.should.have.length(8);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 key in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        // board legacy id
        legacy.should.have.length(1);
        return probe.del(LEGACY, legacy[0].key);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#find', function() {
    var testBoard = { name: 'Board', description: 'Description' };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { testBoard = board; })
      .then(function() {
        return boards.find(testBoard.id)
        .then(function(board) {
          testBoard = board;
        });
      });
    });

    it('should have 1 board in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board
        content.should.have.length(1);
        return probe.del(CONTENT, content[0].key);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have 8 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // last post created at
        // last post username
        // last thread id
        // last thread title
        // post count
        // thread count
        // total post count
        // total thread count
        metadata.should.have.length(8);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#boardByOldId', function() {
    var testBoard = {
      name: 'Board',
      description: 'Description',
      smf: {
        ID_BOARD: '123'
      }
    };

    before(function() {
      return boards.import(testBoard)
      .then(function(board) { testBoard = board; })
      .then(function() {
        return boards.boardByOldId(testBoard.smf.ID_BOARD)
        .then(function(board) {
          testBoard = board;
        });
      });
    });

    it('should have 1 board in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board
        content.should.have.length(1);
        return probe.del(CONTENT, content[0].key);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have 8 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // last post created at
        // last post username
        // last thread id
        // last thread title
        // post count
        // thread count
        // total post count
        // total thread count
        metadata.should.have.length(8);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 key in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(1);
        // board legacy id
        return probe.del(LEGACY, legacy[0].key);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#update', function() {
    var testBoard = { name: 'Board', description: 'Description' };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { testBoard = board; })
      .then(function() {
        testBoard.name = 'updated';
        testBoard.decription = 'updated';
      })
      .then(function() {
        return boards.update(testBoard);
      });
    });

    it('should have 1 board in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        content.should.have.length(1);
        // board
        return probe.del(CONTENT, content[0].key);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have 8 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // last post created at
        // last post username
        // last thread id
        // last thread title
        // post count
        // thread count
        // total post count
        // total thread count
        metadata.should.have.length(8);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#delete', function() {
    var testBoard = { name: 'Board', description: 'Description' };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { testBoard = board; })
      .then(function() {
        return boards.delete(testBoard.id);
      });
    });

    it('should have 1 board in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board
        content.should.have.length(1);
        return probe.del(CONTENT, content[0].key);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have 8 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // last post created at
        // last post username
        // last thread id
        // last thread title
        // post count
        // thread count
        // total post count
        // total thread count
        metadata.should.have.length(8);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#purge', function() {
    var testBoard = { name: 'Board', description: 'Description' };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { testBoard = board; })
      .then(function() {
        return boards.purge(testBoard.id);
      });
    });

    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        content.should.have.length(0);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have 1 key in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import purge', function() {
    var importBoard = {
      name: 'import name',
      description: 'import description',
      smf: { ID_BOARD: '111' }
    };

    before(function() {
      return boards.import(importBoard)
      .then(function(board) {
        importBoard = board;
      })
      .then(function() {
        return boards.purge(importBoard.id);
      });
    });

    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        content.should.have.length(0);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have 1 key in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#all', function() {
    var testBoard = { name: 'Board', description: 'Description' };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { testBoard = board; })
      .then(function() { return boards.create(testBoard); });
    });

    it('should have 2 boards in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        content.should.have.length(2);
        // 2 boards
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have 16 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // 2 last post created at
        // 2 last post username
        // 2 last thread id
        // 2 last thread title
        // 2 post count
        // 2 thread count
        // 2 total post count
        // 2 total thread count
        metadata.should.have.length(16);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#totals', function() {
    var testBoard = { name: 'Board', description: 'Description' };
    var childBoard = { name: 'child', description: 'child' };
    var plainPost = { title: 'post title', body: 'hello world.' };
    var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };

    before(function() {
      return core.users.create(newUser)
      .then(function(user) {
        newUser = user;
        return boards.create(testBoard);
      })
      .then(function(board) {
        testBoard = board;
        childBoard.parent_id = board.id;
        return childBoard;
      })
      .then(boards.create)
      .then(function(board) {
        childBoard = board;
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = newUser.id;
      })
      .then(function() {
        return posts.create(plainPost);
      });
    });

    it('should have 6 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // user, 2 boards, thread, post and version
        content.should.have.length(6);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 objects in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // posts index
        // threads index
        // username index
        // email index
        // thread order index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should 1 post for parent totals', function() {
      var postTotalKey = config.boards.prefix + config.sep + testBoard.id + config.sep + 'total_post_count';
      return probe.get(METADATA, postTotalKey)
      .then(function(postTotal) {
        postTotal.should.be.equal(1);
      });
    });

    it('should 1 thread for parent totals', function() {
      var postTotalKey = config.boards.prefix + config.sep + testBoard.id + config.sep + 'total_thread_count';
      return probe.get(METADATA, postTotalKey)
      .then(function(postTotal) {
        postTotal.should.be.equal(1);
      });
    });

    it('should 1 post for child totals', function() {
      var postTotalKey = config.boards.prefix + config.sep + childBoard.id + config.sep + 'total_post_count';
      return probe.get(METADATA, postTotalKey)
      .then(function(postTotal) {
        postTotal.should.be.equal(1);
      });
    });

    it('should 1 thread for child totals', function() {
      var postTotalKey = config.boards.prefix + config.sep + childBoard.id + config.sep + 'total_thread_count';
      return probe.get(METADATA, postTotalKey)
      .then(function(postTotal) {
        postTotal.should.be.equal(1);
      });
    });

    it('should have 25 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // 2 board last post created at
        // 2 board last post username
        // 2 board last thread id
        // 2 board last thread title
        // 2 board post count
        // 2 board thread count
        // 2 board total post count
        // 2 board total thread count
        // post post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // view count
        metadata.should.have.length(25);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#clean up', function() {
    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        })
        .then(function() {
          content.should.have.length(0);
        });
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        })
        .then(function() {
          indexes.should.have.length(0);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        })
        .then(function() {
          metadata.should.have.length(0);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        return Promise.map(deleted, function(data) {
          return probe.del(DELETED, data.key);
        })
        .then(function() {
          deleted.should.have.length(0);
        });
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        return Promise.map(legacy, function(data) {
          return probe.del(LEGACY, data.key);
        })
        .then(function() {
          legacy.should.have.length(0);
        });
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        return Promise.map(messages, function(data) {
          return probe.del(MESSAGES, data.key);
        })
        .then(function() {
          messages.should.have.length(0);
        });
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

describe('threads', function() {

  describe('#create user, board, thread, post', function() {
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
      .then(function(post) { plainPost = post; });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one board, thread, post and version, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(index) {
          return probe.del(INDEXES, index.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread id
        // board last thread title
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // post post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import user, board, thread, post', function() {
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

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board
        // post and version
        // thread
        // user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread id
        // board last thread title
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // post post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 key in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(1);
        return probe.del(LEGACY, legacy[0].key);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#find', function() {
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
      .then(function() { threads.find(plainThread.id); });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, thread, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread id
        // board last thread title
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // post post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#threadByOldId', function() {
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
      .then(function(post) { plainPost = post; })
      .then(function() { threads.threadByOldId(plainThread.smf.ID_TOPIC); })
      .then(function(thread) { plainThread = thread; });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, thread, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });

      });
    });

    it('should have 17 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread id
        // board last thread title
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // post post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 key in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(1);
        return probe.del(LEGACY, legacy[0].key);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#update', function() {
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
        return threads.update(plainThread)
        .then(function(thread) { plainThread = thread; });
      });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, thread, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread id
        // board last thread title
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // post post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#delete', function() {
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
        plainPost.user_id =  user.id;
        return posts.create(plainPost);
      })
      .then(function(post) { plainPost = post; })
      .then(function() { threads.delete(plainThread.id); });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, threads, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread id
        // board last thread title
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // post post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#purge', function() {
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
      .then(function() { return threads.purge(plainThread.id); });
    });

    it('should have 4 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, user
        content.should.have.length(4);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 3 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // posts index
        // username index
        // email index
        indexes.should.have.length(3);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 10 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order *** SHOULD BE DELETED?
        // thread view count *** SHOULD BE DELETED? NO (cannot be derived again?)
        // ------------------------------------------------
        // thread first post id *** SHOULD BE DELETED? YES
        // thread post title *** SHOULD BE DELETED? YES
        // thread username  *** SHOULD BE DELETED? YES
        // thread last post username *** SHOULD BE DELETED? YES
        // thread last post created at *** SHOULD BE DELETED? YES
        metadata.should.have.length(10);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have 1 object in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import purge', function() {
    var catchCalled = false;
    var plainThread = {
      smf: {
        ID_TOPIC: '112'
      }
    };
    var plainPost = { title: 'post title', body: 'post body' };
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
      .then(function(post) { plainPost = post; })
      .then(function() { return threads.purge(plainThread.id); });
    });

    it('should have 4 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, user
        content.should.have.length(4);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 3 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // posts index
        // username index
        // email index
        indexes.should.have.length(3);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 10 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post username
        // board last post created at
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order *** SHOULD BE DELETED?
        // thread view count *** SHOULD BE DELETED? NO (cannot be derived again?)
        // ------------------------------------------------
        // thread first post id *** SHOULD BE DELETED? YES
        // thread post title *** SHOULD BE DELETED? YES
        // thread username  *** SHOULD BE DELETED? YES
        // thread last post username *** SHOULD BE DELETED? YES
        // thread last post created at *** SHOULD BE DELETED? YES
        metadata.should.have.length(10);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have 1 object in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#byBoard', function() {
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
      })
      .then(function() { return threads.byBoard(boardId, {}); });
    });

    it('should have 8 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, 2 posts and 2 post versions, 2 threads, 1 user
        content.should.have.length(8);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 8 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // 2 post indexes
        // 2 thread indexes
        // 2 thread order indexes
        // username index
        // email index
        indexes.should.have.length(8);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 26 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // 2 post order
        // 2 thread first post id
        // 2 thread last post created at
        // 2 thread last post username
        // 2 thread post count
        // 2 thread order 
        // 2 thread title
        // 2 thread username
        // 2 thread view count
        metadata.should.have.length(26);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#clean up', function() {
    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        })
        .then(function() {
          content.should.have.length(0);
        });
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        })
        .then(function() {
          indexes.should.have.length(0);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        })
        .then(function() {
          metadata.should.have.length(0);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        return Promise.map(deleted, function(data) {
          return probe.del(DELETED, data.key);
        })
        .then(function() {
          deleted.should.have.length(0);
        });
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        return Promise.map(legacy, function(data) {
          return probe.del(LEGACY, data.key);
        })
        .then(function() {
          legacy.should.have.length(0);
        });
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        return Promise.map(messages, function(data) {
          return probe.del(MESSAGES, data.key);
        })
        .then(function() {
          messages.should.have.length(0);
        });
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

describe('posts', function() {

  describe('#create user, board, thread, post', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
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
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
      })
      .then(function() {
        return posts.create(plainPost);
      });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one board, thread, post and version, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(index) {
          return probe.del(INDEXES, index.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import user, board, thread, post', function() {
    var plainPost = {
      title: 'post title',
      body: 'hello world.',
      smf: {
        ID_MSG: '123'
      }
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
        return { board_id: board.id };
      })
      .then(core.threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
      })
      .then(function() {
        return posts.import(plainPost);
      });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board
        // post and version
        // thread
        // user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 key in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        // legacy post id
        legacy.should.have.length(1);
        return probe.del(LEGACY, legacy[0].key);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#find', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
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
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) { plainPost = post; })
      .then(function() { return posts.find(plainPost.id); });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, thread, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order 
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#postByOldId', function() {
    var plainPost = {
      title: 'post title',
      body: 'hello world.',
      smf: {
        ID_MSG: '123'
      }
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
        return { board_id: board.id };
      })
      .then(core.threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.import(plainPost);
      })
      .then(function(post) { plainPost = post; })
      .then(function() { return posts.postByOldId(plainPost.smf.ID_MSG); });
    });

    it('should have 5 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and version, thread, user
        content.should.have.length(5);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });

      });
    });

    it('should have 17 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // therad order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 key in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        // legacy post id
        legacy.should.have.length(1);
        return probe.del(LEGACY, legacy[0].key);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#update', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
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
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) { plainPost = post; })
      .then(function() { return posts.update(plainPost); });
    });

    it('should have 6 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and 2 versions, thread, user
        content.should.have.length(6);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#delete', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
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
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) { plainPost = post; })
      .then(function() { return posts.delete(plainPost.id); });
    });

    it('should have 6 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, post and 2 versions, threads, user
        content.should.have.length(6);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 5 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // post index
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(5);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 17 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // posts post order
        // thread first post id
        // thread last post created at
        // thread last post username
        // thread post count
        // thread order
        // thread title
        // thread username
        // thread view count
        metadata.should.have.length(17);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#purge', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
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
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) { plainPost = post; })
      .then(function() { return posts.purge(plainPost.id); });
    });

    it('should have 3 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, thread, and user
        content.should.have.length(3);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 4 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(4);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 15 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // thread last post created at  *** SHOULD BE DELETED?
        // thread last post username  *** SHOULD BE DELETED?
        // thread post count
        // thread order
        // thread post title *** SHOULD BE DELETED?
        // thread username  *** SHOULD BE DELETED?
        // thread view count  *** SHOULD BE DELETED?
        // thread first post id (deleted) *** SHOULD BE DELETED?
        metadata.should.have.length(15);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have 1 object in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        // deleted post
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import purge', function() {
    var user;
    var plainPost = {
      title: 'post title',
      body: 'hello world.',
      smf: {
        ID_MSG: '123'
      }
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
      .then(core.threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.import(plainPost);
      })
      .then(function(post) { plainPost = post; })
      .then(function() { return posts.purge(plainPost.id); });
    });

    it('should have 3 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, thread, user
        content.should.have.length(3);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 4 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // thread index
        // thread order index
        // username index
        // email index
        indexes.should.have.length(4);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 15 keys in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post username
        // board last post created at
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // thread last post created at  *** SHOULD BE DELETED?
        // thread username  *** SHOULD BE DELETED?
        // thread post count
        // thread order
        // thread post title *** SHOULD BE DELETED?
        // thread last post username  *** SHOULD BE DELETED?
        // thread view count  *** SHOULD BE DELETED?
        // thread first post id (deleted) *** SHOULD BE DELETED?
        metadata.should.have.length(15);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have 1 object in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        // deleted post
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#byThread', function() {
    var post1 = { title: 'title', body: 'body' };
    var post2 = { title: 'title', body: 'body' };
    var parentThead, user;

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
      .then(core.threads.create)
      .then(function(thread) {
        parentThread = thread;
        post1.thread_id = thread.id;
        post1.user_id = user.id;
        post2.thread_id = thread.id;
        post2.user_id = user.id;
      })
      .then(function() {
        return posts.create(post1)
        .then(function(post){
          post1 = post;
        });
      })
      .then(function() {
        return posts.create(post2)
        .then(function(post) {
          post2 = post;
        });
      })
      .then(function() { return posts.byThread(parentThread.id, {}); });
    });

    it('should have 7 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // board, 2 posts and 2 post versions, 1 threads, 1 user
        content.should.have.length(7);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 6 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // 2 post indexes
        // 1 thread indexes
        // 1 thread order index
        // username index
        // email index
        indexes.should.have.length(6);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have 18 objects in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        // board last post created at
        // board last post username
        // board last thread title
        // board last thread id
        // board post count
        // board thread count
        // board total post count
        // board total thread count
        // 2 posts post order
        // 1 thread first post id
        // 1 thread last post created at
        // 1 thread last post username
        // 1 thread post count
        // 1 thread order
        // 1 thread title
        // 1 thread username
        // 1 thread view count
        metadata.should.have.length(18);
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#clean up', function() {
    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        })
        .then(function() {
          content.should.have.length(0);
        });
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        })
        .then(function() {
          indexes.should.have.length(0);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        })
        .then(function() {
          metadata.should.have.length(0);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        return Promise.map(deleted, function(data) {
          return probe.del(DELETED, data.key);
        })
        .then(function() {
          deleted.should.have.length(0);
        });
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        return Promise.map(legacy, function(data) {
          return probe.del(LEGACY, data.key);
        })
        .then(function() {
          legacy.should.have.length(0);
        });
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        return Promise.map(messages, function(data) {
          return probe.del(MESSAGES, data.key);
        })
        .then(function() {
          messages.should.have.length(0);
        });
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

describe('users', function() {

  describe('#create', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() { return users.create(user); });

    it('should have 1 object in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one user
        content.should.have.length(1);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 2 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // username index
        // email index
        indexes.should.have.length(2);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk',
      smf: {
        ID_MEMBER: 123
      }
    };
    before(function() { return users.import(user); });

    it('should have 1 object in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one user
        content.should.have.length(1);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 2 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // username index
        // email index
        indexes.should.have.length(2);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 key in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(1);
        return probe.del(LEGACY, legacy[0].key);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#find', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(user)
      .then(function(dbUser) { user = dbUser; })
      .then(function() { return users.find(user.id); });
    });

    it('should have 1 object in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one user
        content.should.have.length(1);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 2 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // username index
        // email index
        indexes.should.have.length(2);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#userByOldId', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk',
      smf: {
        ID_MEMBER: 123
      }
    };

    before(function() {
      return users.import(user)
      .then(function(dbUser) { user = dbUser; })
      .then(function() { return users.userByOldId(user.smf.ID_MEMBER); });
    });

    it('should have 1 object in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one user
        content.should.have.length(1);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 2 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // username index
        // email index
        indexes.should.have.length(2);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have 1 object in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(1);
        return Promise.map(legacy, function(data) {
          return probe.del(LEGACY, data.key);
        });
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#userByUsername', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };

    before(function() {
      return users.create(user)
      .then(function(dbUser) { user = dbUser; })
      .then(function() { return users.userByUsername(user.username); });
    });

    it('should have 1 object in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one user
        content.should.have.length(1);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 2 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // username index
        // email index
        indexes.should.have.length(2);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#update', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };

    before(function() {
      return users.create(user)
      .then(function(dbUser) { user = dbUser; })
      .then(function() {
        user.email = "anotheruser@example.com";
        return users.update(user);
      });
    });

    it('should have 1 object in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one user
        content.should.have.length(1);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 2 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // username index
        // email index
        indexes.should.have.length(2);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#delete', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(user)
      .then(function(dbUser) { user = dbUser; })
      .then(function() { return users.delete(user.id); });
    });

    it('should have 1 object in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // one user
        content.should.have.length(1);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 2 index in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // username index
        // email index
        indexes.should.have.length(2);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#purge', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(user)
      .then(function(dbUser) { user = dbUser; })
      .then(function() { return users.purge(user.id); });
    });

    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        content.should.have.length(0);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have 1 object in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#import purge', function() {
    var user = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk',
      smf: {
        ID_MEMBER: 123
      }
    };
    before(function() {
      return users.import(user)
      .then(function(dbUser) {
        user = dbUser;
      })
      .then(function() {
        return users.purge(user.id);
      });
    });

    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        content.should.have.length(0);
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        indexes.should.have.length(0);
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have 1 object in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(1);
        return probe.del(DELETED, deleted[0].key);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#all', function() {
    var user1 = {
      username: 'test_user1',
      email: 'test_user1@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    var user2 = {
      username: 'test_user2',
      email: 'test_user2@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };

    before(function() {
      return users.create(user1)
      .then(function() { return users.create(user2); });
    });

    it('should have 2 objects in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        // 2 users
        content.should.have.length(2);
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        });
      });
    });

    it('should have 4 indexes in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        // 2 usenname index
        // 2 email index
        indexes.should.have.length(4);
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        metadata.should.have.length(0);
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        deleted.should.have.length(0);
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        legacy.should.have.length(0);
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        messages.should.have.length(0);
      });
    });
  });

  describe('#clean up', function() {
    it('should have nothing in content', function() {
      return probe.all(CONTENT)
      .then(function(content) {
        return Promise.map(content, function(data) {
          return probe.del(CONTENT, data.key);
        })
        .then(function() {
          content.should.have.length(0);
        });
      });
    });

    it('should have nothing in indexes', function() {
      return probe.all(INDEXES)
      .then(function(indexes) {
        return Promise.map(indexes, function(data) {
          return probe.del(INDEXES, data.key);
        })
        .then(function() {
          indexes.should.have.length(0);
        });
      });
    });

    it('should have nothing in metadata', function() {
      return probe.all(METADATA)
      .then(function(metadata) {
        return Promise.map(metadata, function(data) {
          return probe.del(METADATA, data.key);
        })
        .then(function() {
          metadata.should.have.length(0);
        });
      });
    });

    it('should have nothing in deleted', function() {
      return probe.all(DELETED)
      .then(function(deleted) {
        return Promise.map(deleted, function(data) {
          return probe.del(DELETED, data.key);
        })
        .then(function() {
          deleted.should.have.length(0);
        });
      });
    });

    it('should have nothing in legacy', function() {
      return probe.all(LEGACY)
      .then(function(legacy) {
        return Promise.map(legacy, function(data) {
          return probe.del(LEGACY, data.key);
        })
        .then(function() {
          legacy.should.have.length(0);
        });
      });
    });

    it('should have nothing in messages', function() {
      return probe.all(MESSAGES)
      .then(function(messages) {
        return Promise.map(messages, function(data) {
          return probe.del(MESSAGES, data.key);
        })
        .then(function() {
          messages.should.have.length(0);
        });
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});
