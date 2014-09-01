var rimraf = require('rimraf');
var should = require('chai').should();
var Promise = require('bluebird');
var path = require('path');
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);
var threads = core.threads;
var posts = core.posts;
var boards = core.boards;

describe('metadata', function() {
  describe('#boards', function() {
    var plainPost = {
      title: 'post title',
      body: 'post body',
      created_at: '1409533100723'
    };
    var boardId, user;
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
        boardId = board.id;
        var threadData = { board_id: board.id };
        // BREAKS IF CHANGED TO Promise.map DUE TO SYNCHRONICITY ISSUE WITH METADATA INCREMENTS
        return [ threadData, threadData, threadData ];
      })
      .then(function(threadArray) {
        return Promise.map(threadArray, function(threadToCreate) {
          return threads.create(threadToCreate)
          .then(function(thread) {
            var tempPost = plainPost;
            tempPost.thread_id = thread.id;
            tempPost.user_id = user.id;
            return [tempPost, tempPost, tempPost];
          })
          .then(function(postArray) {
            return Promise.map(postArray, function(post) {
              return posts.create(post);
            });
          });
        });
      });
    });

    describe('#post_count', function() {
      it('should have correct post count', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.post_count.should.equal(9);
        });
      });
    });

    describe('#thread_count', function() {
      it('should have correct thread count', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.thread_count.should.equal(3);
        });
      });
    });

    describe('#last_post_username', function() {
      it('should have correct last post username', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.last_post_username.should.equal('test_user');
        });
      });
    });

    describe('#last_post_created_at', function() {
      it('should have correct last post created at time', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.last_post_created_at.should.equal(plainPost.created_at);
        });
      });
    });

    describe('#last_thread_title', function() {
      it('should have correct last thread title', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.last_thread_title.should.equal(plainPost.title);
        });
      });
    });

  });

  describe('#threads', function() {
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };
    var threadId, firstPostId, user;
    var first = true;
    var firstPostTitle = 'First Post Title!';
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
        var threadData = { board_id: board.id };
        return threadData;
      })
      .then(function(threadToCreate) {
        return threads.create(threadToCreate)
        .then(function(thread) {
          threadId = thread.id;
          plainPost.thread_id = thread.id;
          plainPost.user_id = user.id;
          var firstPost = {
            user_id: user.id,
            thread_id: thread.id,
            title: firstPostTitle,
            body: 'this is the first post'
          };
          return [ firstPost, plainPost, plainPost, plainPost, plainPost ];
        })
        .then(function(postArray) {
          return Promise.map(postArray, function(post) {
            return posts.create(post)
            .then(function(post) {
              if (first) {
                firstPostId = post.id;
                firstPostTitle = post.title;
                first = false;
              }
            });
          });
        });
      });
    });

    describe('#post_count', function() {
      it('should have correct post count', function() {
        return threads.find(threadId)
        .then(function(thread) {
          thread.post_count.should.equal(5);
        });
      });
    });

    describe('#first_post_id', function() {
      it('should store the id of the first post', function() {
        return threads.find(threadId)
        .then(function(thread) {
          thread.first_post_id.should.equal(firstPostId);
        });
      });
    });

    describe('#title', function() {
      it('should store the title of the first post', function() {
        return threads.find(threadId)
        .then(function(thread) {
          thread.first_post_id.should.equal(firstPostId);
        });
      });
    });

    describe('#user', function() {
      it('should store the user who created the thread/first post', function() {
        return threads.find(threadId)
        .then(function(thread) {
          thread.user.should.be.ok;
          thread.user.username.should.equal('test_user');
        });
      });
    });
  });

  describe('#posts', function() {
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

    describe('#user', function() {
      it('should store the user who created the post', function() {
        return posts.find(plainPost.id)
        .then(function(thread) {
          thread.user.should.be.ok;
          thread.user.username.should.equal('test_user');
          thread.user.id.should.equal(user.id);
        });
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

