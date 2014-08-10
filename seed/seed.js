var async = require('async');
var path = require('path');
var core = require(path.join(__dirname, '..'));
var users = core.users;
var boards = core.boards;
var posts = core.posts;
var threads = core.threads;

var createBoards = function (numBoards, finishedCb) {
  async.times(numBoards, function(n, next) {
    boards.create({
      name: 'Board ' + n,
      description: 'Hello World! This is board ' + n + ' in a popular forum.'
    })
    .then(function(board) {
      next(null);
    })
    .catch(function(err) {
      next(err);
    });
  },
  function(err) {
    finishedCb(err);
  });
};

var createPost = function(threadId, j, cb) {
  var post = {
    title: 'Post ' + j,
    body: 'Hello World! This is post ' + j,
    thread_id: threadId
  };
  posts.create(post)
  .then(function(post) {
    return cb(null, post);
  })
  .catch(function(err) {
    return cb(err, undefined);
  });
};

var createThreadsAndPosts = function (numThreads, numPosts, finishedCb) {

  var createThread = function(board, cb) {
    async.times(numThreads, function(n, nextThread) {
      var newThread = {
        title: 'Thread ' + n,
        body: 'Hello World! This is thread ' + n,
        board_id: board.id
      };
      threads.create(newThread)
      .then(function(post) {
        async.times(numPosts, function(j, nextPost) {
          createPost(post.thread_id, j, function(err) {
            nextPost(err);
          });
        },
        function(err) {
          nextThread(err);
        });
      })
      .catch(function(err) {
        console.log(err);
        nextThread(err);
      });
    },
    function(err) {
      cb(err);
    });
  };

  boards.all()
  .then(function(allBoards) {
    async.times(allBoards.length, function(n, nextBoard) {
      createThread(allBoards[n], function(err) {
        nextBoard(err);
      });
    },
    function(err) {
      finishedCb(err);
    });
  })
  .catch(function(err) {
    console.log(err);
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
