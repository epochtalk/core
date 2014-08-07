var assert = require('assert');
var async = require('async');
var path = require('path');
var posts = require(path.join(__dirname, '..', 'posts'));
var threads = require(path.join(__dirname, '..', 'threads'));
var boards = require(path.join(__dirname, '..', 'boards'));
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var emptyCb = function() {};
var savedPost, savedBoardId, savedThreadId;
var importThreadId, importThreadPostId, importPostId;
var oldThreadId, oldFirstPostId, oldSecondPostId;

describe('posts', function() {
  describe('#CREATE', function() {
    it('should create a post', function(done) {
      seed.init(1, 2, 0, function() {
        boards.all()
        .then(function(allBoards) {
          savedBoardId = allBoards[0].id;
          threads.threads(allBoards[0].id, {}, function(err, allThreads) {
            savedThreadId = allThreads[0].id;
            var testPost = {
              title: 'Test Post Title',
              body: 'Test Post Body',
              thread_id: savedThreadId
            };
            posts.create(testPost, function(err, post) {
              if (err) console.log(err);
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
        if (err) console.log(err);
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
      threads.threads(savedBoardId, { startThreadId: savedThreadId }, function(err, threadsForBoard) {
        if(err) console.log(err);
        if (!err) {
          assert.equal(threadsForBoard.length, 1);
          threads.threads(savedBoardId, { limit: 1 }, function(err, threadsForBoard) {
            if (err) console.log(err);
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
  describe('#IMPORT', function() {
    it('should import a post', function(done) {
      // thread starting post with prior thread_id and post_id
      oldThreadId = 222;
      oldFirstPostId = 111;
      var importNewThreadPost = {
        title: 'import title',
        body: 'import body',
        board_id: savedBoardId,
        smf: {
          post_id: oldFirstPostId,
          thread_id: oldThreadId
        }
      };

      threads.import(importNewThreadPost, function(err, post) {
        if(err) console.log(err);

        // validate thread import -- only returns imported post
        assert.notEqual(post.id, undefined);
        assert.equal(post.title, importNewThreadPost.title);
        assert.equal(post.body, importNewThreadPost.body);
        assert.equal(post.board_id, importNewThreadPost.board_id);
        assert.notEqual(post.thread_id, undefined);
        assert.equal(post.smf.post_id, importNewThreadPost.smf.post_id);
        importThreadId = post.thread_id;
        importThreadPostId = post.id;

        // import second post with only post_id
        oldSecondPostId = 112;
        var secondImportPost = {
          title: 'second title',
          body: 'second body',
          thread_id: post.thread_id,
          smf: {
            post_id: oldSecondPostId
          }
        };

        posts.import(secondImportPost, function(err, secondPost) {
          // validate post import
          assert.notEqual(secondPost.id, undefined);
          assert.equal(secondPost.title, secondImportPost.title);
          assert.equal(secondPost.body, secondImportPost.body);
          assert.equal(secondPost.thread_id, secondImportPost.thread_id);
          assert.equal(secondPost.smf.post_id, secondImportPost.smf.post_id);
          importPostId = secondPost.id;
          done();
        });
      });
    });
  });
});

describe('posts', function() {
  describe('#IMPORT_GET', function() {
    it('should verify key mapping for imported posts/threads', function() {
      threads.threadByOldId(oldThreadId, function(err, thread) {
        assert.equal(thread.id, importThreadId);
      });

      posts.postByOldId(oldFirstPostId, function(err, firstPost) {
        assert.equal(firstPost.id, importThreadPostId);
      });

      posts.postByOldId(oldSecondPostId, function(err, secondPost) {
        assert.equal(secondPost.id, importPostId);
      });
    });
  });
});

describe('posts', function() {
  describe('#IMPORT_DELETE', function() {
    it('should delete all imported posts/threads key mappings', function(done) {

      posts.delete(importThreadPostId, function(err, post) {
        threads.threadByOldId(oldThreadId, function(err, thread) {
          var expectedErr = 'Key not found in database';
          assert.equal(err.message, expectedErr);
        });

        posts.postByOldId(oldFirstPostId, function(err, firstPost) {
          var expectedErr = 'Key not found in database';
          assert.equal(err.message, expectedErr);
        });

        posts.delete(importPostId, function(err, secondPost) {
          posts.postByOldId(oldSecondPostId, function(err, secondPost) {
            var expectedErr = 'Key not found in database';
            assert.equal(err.message, expectedErr);
            done();
          });
        });

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

            // tear down
            boards.all()
            .then(function(allBoards) {
              deleteAllBoards(allBoards, done);
            });
          });
        }
      });
    });
  });
});

function deleteAllBoards(allBoards, callback) {
  // for each board
  async.each(allBoards, function(board, bCallback) {
    // delete the board
    boards.delete(savedBoardId);
    
    // get all the threads for this board
    threads.threads(board.id, {}, function(err, allThreads) {
      deleteAllThreads(allThreads, bCallback);
    });
  },
  function(err) {
    return callback(err);
  });
}

function deleteAllThreads(allThreads, callback) {
  // for each thread
  async.each(allThreads, function(thread, tCallback) {
    // get all the posts for this thread
    posts.byThread(thread.id, {}, function(err, allPosts) {
      deleteAllPosts(allPosts, function(err) {
        tCallback(err);
      });
    });
  },
  function(err) {
    return callback(err);
  });
}

function deleteAllPosts(allPosts, callback) {
  async.each(allPosts, function(post, cb) {
    posts.delete(post.id, function(err, post) {
      cb(err);
    });
  },
  function(err) {
    return callback(err);
  });
}
