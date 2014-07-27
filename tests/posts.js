var assert = require('assert');
var posts = require(__dirname + '/../posts');
var boards = require(__dirname + '/../boards');
var seed = require(__dirname + '/../seed/seed');
var emptyCb = function() {};
var savedPost, savedBoardId, savedThreadId;

describe('posts', function() {
  describe('#CREATE', function() {
    it('should create a post', function(done) {
      seed.init(1, 2, 0, function() {
        boards.all(function(err, allBoards) {
          savedBoardId = allBoards[0].id;
          posts.threads(allBoards[0].id, {}, function(err, allThreads) {
            savedThreadId = allThreads[0].id;
            var testPost = {
              title: 'Test Post Title',
              body: 'Test Post Body',
              thread_id: savedThreadId,
              board_id: savedBoardId
            };
            posts.create(testPost, function(err, post) {
              savedPost = post;
              assert.equal(post.title, testPost.title);
              assert.equal(post.body, testPost.body);
              assert.equal(post.thread_id, testPost.thread_id);
              assert.equal(post.board_id, testPost.board_id);
              done();
            });
          });
        });
      });
    });
  });
});

describe('posts', function() {
  describe('#FIND', function() {
    it('should find specified post', function(done) {
      posts.find(savedPost.id, function(err, post) {
        if (!err) {
          assert.equal(post.title, savedPost.title);
          assert.equal(post.body, savedPost.body);
          assert.equal(post.thread_id, savedPost.thread_id);
          assert.equal(post.board_id, savedPost.board_id);
          done();
        }
      });
    });
  });
});

describe('posts', function() {
  describe('#UPDATE', function() {
    it('should update specified post', function(done) {
      var newTitle = 'Test Post Title Modified';
      var newBody = 'Test Post Body Modified';
      savedPost.title = newTitle;
      savedPost.body = newBody;
      posts.update(savedPost, function(err, post) {
        assert.equal(post.title, newTitle);
        assert.equal(post.body, newBody);
        posts.find(post.id, function(err, retrievedPost) {
          assert.equal(retrievedPost.title, newTitle);
          assert.equal(retrievedPost.body, newBody);
          assert.equal(retrievedPost.thread_id, savedPost.thread_id);
          assert.equal(retrievedPost.board_id, savedPost.board_id);
          done();
        });
      });
    });
  });
});

describe('posts', function() {
  describe('#THREADS', function() {
    it('should return all threads for a board', function(done) {
      posts.threads(savedBoardId, { startThreadId: savedThreadId }, function(err, threadsForBoard) {
        if (!err) {
          assert.equal(threadsForBoard.length, 2);
          posts.threads(savedBoardId, { limit: 1 }, function(err, threadsForBoard) {
            if (!err) {
              assert.equal(threadsForBoard.length, 1);
              done();
            }
          });
        }
      });
    });
  });
});

describe('posts', function() {
  describe('#BYTHREAD', function() {
    it('should return all posts for a thread', function(done) {
      posts.byThread(savedThreadId, { }, function(err, postsForThread) {
        if (!err) {
          assert.equal(postsForThread.length, 2);
          posts.byThread(savedThreadId, { limit: 1 }, function(err, postsForThread) {
            if (!err) {
              assert.equal(postsForThread.length, 1);
              posts.byThread(savedThreadId, { startPostId: postsForThread[0].id  }, function(err, postsForThread) {
                if (!err) {
                  assert.equal(postsForThread.length, 1);
                  assert.equal(postsForThread[0].title, savedPost.title);
                  assert.equal(postsForThread[0].body, savedPost.body);
                  assert.equal(postsForThread[0].board_id, savedPost.board_id);
                  assert.equal(postsForThread[0].thread_id, savedPost.thread_id);
                  done();
                }
              });
            }
          });
        }
      });
    });
  });
});

describe('posts', function() {
  describe('#DELETE', function() {
    it('should delete specified post', function(done) {
      posts.delete(savedPost.id, function(err, post) {
        if (!err) {
          assert.equal(post.title, savedPost.title);
          assert.equal(post.body, savedPost.body);
          posts.find(post.id, function(err) {
            var expectedErr = 'Key not found in database [post~' + savedPost.id + ']';
            assert.equal(err.message, expectedErr);
            posts.delete(post.thread_id, function() {
              boards.delete(post.board_id, function() {
                done();
              });
            });
          });
        }
      });
    });
  });
});
