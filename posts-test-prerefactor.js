var assert = require('assert');
var async = require('async');
var path = require('path');
var core = require(path.join(__dirname, '..'))('test-epoch.db');
var posts = core.posts;
var threads = core.threads;
var boards = core.boards;
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var emptyCb = function() {};
var savedPost, savedBoardId, savedThreadId;
var importThreadId, importThreadPostId, importPostId;
var oldThreadId, oldFirstPostId, oldSecondPostId;

seed.initDb('test-epoch.db');

describe('posts', function() {
  describe('#CREATE', function() {
    it('should create a post', function(done) {
      seed.init(1, 2, 0, function() {
        var testPost = {
            title: 'Test Post Title',
            body: 'Test Post Body',
          };

        boards.all()
        .then(function(allBoards) {
          savedBoardId = allBoards[0].id;
          return [savedBoardId, {}];
        })
        .spread(threads.threads)
        .then(function(allThreads) {
          savedThreadId = allThreads[0].id;
          testPost.thread_id = savedThreadId;
          return testPost;
        })
        .then(posts.create)
        .then(function(post) {
          savedPost = post;
          assert.equal(post.title, testPost.title);
          assert.equal(post.body, testPost.body);
          assert.equal(post.thread_id, testPost.thread_id);
          assert.equal(post.board_id, testPost.board_id);
          done();
        })
        .catch(function(err) {
          console.log(err);
          done(err);
        });
      });
    });
  });
});

describe('posts', function() {
  describe('#FIND', function() {
    it('should find specified post', function(done) {
      posts.find(savedPost.id)
      .then(function(post) {
        assert.equal(post.title, savedPost.title);
        assert.equal(post.body, savedPost.body);
        assert.equal(post.thread_id, savedPost.thread_id);
        assert.equal(post.board_id, savedPost.board_id);
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
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
      posts.update(savedPost)
      .then(function(post) {
        assert.equal(post.title, newTitle);
        assert.equal(post.body, newBody);
        return post.id;
      })
      .then(posts.find)
      .then(function(retrievedPost) {
        assert.equal(retrievedPost.title, newTitle);
        assert.equal(retrievedPost.body, newBody);
        assert.equal(retrievedPost.thread_id, savedPost.thread_id);
        assert.equal(retrievedPost.board_id, savedPost.board_id);
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
      });
    });
  });
});

describe('posts', function() {
  describe('#THREADS', function() {
    it('should return all threads for a board', function(done) {
      threads.threads(savedBoardId, { startThreadId: savedThreadId })
      .then(function(threadsForBoard) {
        assert.equal(threadsForBoard.length, 1);
        return [savedBoardId, { limit: 1}];
      })
      .spread(threads.threads)
      .then(function(threadsForBoard) {
        assert.equal(threadsForBoard.length, 1);
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
      });
    });
  });
});

describe('posts', function() {
  describe('#BYTHREAD', function() {
    it('should return all posts for a thread', function(done) {

      posts.byThread(savedThreadId, {})
      .then(function(postsForThread) {
        assert.equal(postsForThread.length, 2);
        return [savedThreadId, { limit: 1 }];
      })
      .spread(posts.byThread)
      .then(function(postsForThread) {
        assert.equal(postsForThread.length, 1);
        return [savedThreadId, { startPostId: postsForThread[0].id }];
      })
      .spread(posts.byThread)
      .then(function(postsForThread) {
        assert.equal(postsForThread.length, 1);
        assert.equal(postsForThread[0].title, savedPost.title);
        assert.equal(postsForThread[0].body, savedPost.body);
        assert.equal(postsForThread[0].board_id, savedPost.board_id);
        assert.equal(postsForThread[0].thread_id, savedPost.thread_id);
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
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
      // import second post with only post_id
      oldSecondPostId = 112;
      var secondImportPost = {
        title: 'second title',
        body: 'second body',
        smf: {
          post_id: oldSecondPostId
        }
      };

      threads.import(importNewThreadPost)
      .then(function(post) {
        // validate thread import -- only returns imported post
        assert.notEqual(post.id, undefined);
        assert.equal(post.title, importNewThreadPost.title);
        assert.equal(post.body, importNewThreadPost.body);
        assert.equal(post.board_id, importNewThreadPost.board_id);
        assert.notEqual(post.thread_id, undefined);
        assert.equal(post.smf.post_id, importNewThreadPost.smf.post_id);
        importThreadId = post.thread_id;
        importThreadPostId = post.id;

        secondImportPost.thread_id = post.thread_id;
        return secondImportPost;
      })
      .then(posts.import)
      .then(function(secondPost) {
        // validate post import
        assert.notEqual(secondPost.id, undefined);
        assert.equal(secondPost.title, secondImportPost.title);
        assert.equal(secondPost.body, secondImportPost.body);
        assert.equal(secondPost.thread_id, secondImportPost.thread_id);
        assert.equal(secondPost.smf.post_id, secondImportPost.smf.post_id);
        importPostId = secondPost.id;
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
      });

    });
  });
});

describe('posts', function() {
  describe('#IMPORT_GET', function() {
    it('should verify key mapping for imported posts/threads', function() {
      threads.threadByOldId(oldThreadId)
      .then(function(threadId) {
        assert.equal(threadId, importThreadId);
      })
      .catch(function(err) { console.log(err); });

      posts.postByOldId(oldFirstPostId)
      .then(function(firstPostId) {
        assert.equal(firstPostId, importThreadPostId);
      })
      .catch(function(err) { console.log(err); });

      posts.postByOldId(oldSecondPostId)
      .then(function(secondPostId) {
        assert.equal(secondPostId, importPostId);
      })
      .catch(function(err) { console.log(err); });
    });
  });
});

describe('posts', function() {
  describe('#IMPORT_DELETE', function() {
    it('should delete all imported posts/threads key mappings', function(done) {

      posts.delete(importThreadPostId)
      .then(function(post) {
        return threads.threadByOldId(oldThreadId)
        .catch(function(err) {
          assert.notEqual(err, undefined);
        });
      })
      .then(function(){
        return posts.postByOldId(oldFirstPostId)
        .catch(function(err) {
          assert.notEqual(err, null);
        });
      })
      .then(function() {
        return posts.delete(importPostId)
        .then(function(secondPost) {
          return posts.postByOldId(oldSecondPostId)
          .catch(function(err) {
            assert.notEqual(err, null);
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
      posts.delete(savedPost.id)
      .then(function(post) {
        assert.equal(post.title, savedPost.title);
        assert.equal(post.body, savedPost.body);
        return post.id;
      })
      .then(posts.find)
      .catch(function(err) {
        assert.notEqual(err, null); // expecting error
        
        // tear down
        return boards.all()
        .then(function(allBoards) {
          deleteAllBoards(allBoards, done);
        });
      });

    });
  });
});

function deleteAllBoards(allBoards, callback) {
  // for each board
  async.each(allBoards, function(board, bCallback) {
    // delete the board
    boards.delete(board.id)
    .then(function(delBoard) {
      return [delBoard.id, {}];
    })
    .spread(threads.threads)
    .then(function(allThreads){
      deleteAllThreads(allThreads, bCallback);
    })
    .catch(function(err) {
      bCallback(err);
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
    posts.byThread(thread.id, {})
    .then(function(allPosts) {
      deleteAllPosts(allPosts, function(err) {
        tCallback(err);
      });
    })
    .catch(function(err) {
      tCallback(err);
    });
  },
  function(err) {
    return callback(err);
  });
}

function deleteAllPosts(allPosts, callback) {
  async.each(allPosts, function(post, cb) {
    posts.delete(post.id)
    .then(function(post) {
      cb(null);
    })
    .catch(function(err) {
      cb(err);
    });
  },
  function(err) {
    return callback(err);
  });
}
