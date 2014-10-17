var rimraf = require('rimraf');
var should = require('chai').should();
var Promise = require('bluebird');
var path = require('path');
var dbName = '.testDB';
var core = require(path.join(__dirname, '..'))(dbName);
var probe = require(path.join(__dirname, '..', 'probe'))(core.engine);
var threads = core.threads;
var posts = core.posts;
var boards = core.boards;

describe('metadata', function() {
  describe('#boards', function() {
    var plainPost = {
      title: 'post title',
      body: 'post body'
    };
    var boardId, user, tempPost;
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
        return [ threadData, threadData, threadData ];
      })
      .then(function(threadArray) {
        return Promise.map(threadArray, function(threadToCreate) {
          return threads.create(threadToCreate)
          .then(function(thread) {
            tempPost = plainPost;
            tempPost.thread_id = thread.id;
            tempPost.user_id = user.id;
            return [tempPost, tempPost, tempPost];
          })
          .then(function(postArray) {
            return Promise.map(postArray, function(post) {
              return posts.create(post)
              .then(function(newPost) {
                plainPost = newPost;
              });
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

    describe('#total_post_count', function() {
      it('should have correct post count', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.total_post_count.should.equal(9);
        });
      });
    });

    describe('#total_thread_count', function() {
      it('should have correct thread count', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.total_thread_count.should.equal(3);
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

    describe('#last_thread_id', function() {
      it('should have correct last thread id', function() {
        return boards.find(boardId)
        .then(function(board) {
          board.last_thread_id.should.equal(tempPost.thread_id);
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
              else {
                plainPost = post;
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

    describe('#last_post_username', function() {
      it('should store the user who posted last in the thread', function() {
        return threads.find(threadId)
        .then(function(thread) {
          thread.last_post_username.should.be.ok;
          thread.last_post_username.should.equal('test_user');
        });
      });
    });

    describe('#last_post_created_at', function() {
      it('should store the time when the last post in the thread was created', function() {
        return threads.find(threadId)
        .then(function(thread) {
          thread.last_post_created_at.should.be.ok;
          thread.last_post_created_at.should.equal(plainPost.created_at);
        });
      });
    });

    describe('#view_count', function() {
      it('should store the view count of a thread', function() {
        return threads.find(threadId)
        .then(function(thread) {
          thread.view_count.should.exist;
          // TODO: We need to change this test once view count is implemented fully.
          thread.view_count.should.deep.equal(0);
        });
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

