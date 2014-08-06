var async = require('async');
var path = require('path');
var core = require(path.join(__dirname, '..'));
var boards = core.boards;
var posts = core.posts;
var threads = core.threads;

var createBoards = function (numBoards, finishedCb) {
  var createBoard = function(n, cb) {
    boards.create({
      name: 'Board ' + n,
      description: 'Hello World! This is board ' + n + ' in a popular forum.'
    }, cb);
  };

  async.times(numBoards, function(n, next) {
    createBoard(n, function(err) {
      next(err);
    });
  }, function(err) {
    finishedCb(err);
  });
};

var createThreadsAndPosts = function (numThreads, numPosts, finishedCb) {
  var createPost = function(threadId, j, cb) {
    posts.create({title: 'Post ' + j, body: 'Hello World! This is post ' + j, thread_id: threadId}, cb);
  };

  var createThread = function(board, cb) {
    async.times(numThreads, function(n, nextThread) {
      threads.create({title: 'Thread ' + n, body: 'Hello World! This is thread ' + n, board_id: board.id}, function(err, post) {
        async.times(numPosts, function(j, nextPost) {
          createPost(post.thread_id, j, function(err) {
            nextPost(err);
          });
        },
        function(err) {
          nextThread(err);
        });
      });
    },
    function(err) {
      cb(err);
    });
  };

  boards.all(function(err, allBoards) {
    async.times(allBoards.length, function(n, nextBoard) {
      createThread(allBoards[n], function(err) {
        nextBoard(err);
      });
    },
    function(err) {
      finishedCb(err);
    });
  });
};

var init = function(numBoards, numThreads, numPosts, finishedCb) {
  createBoards(numBoards, function (err) {
    if (!err) {
      createThreadsAndPosts(numThreads, numPosts, finishedCb);
    }
    else {
      finishedCb(err);
    }
  });
};

module.exports = {
  init: init,
  createBoards: createBoards,
  createThreadsAndPosts: createThreadsAndPosts
};
