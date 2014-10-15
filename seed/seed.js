var dbName = '.testDB';
var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var core = require(path.join(__dirname, '..'))(dbName);
var users = core.users;
var boards = core.boards;
var posts = core.posts;
var threads = core.threads;
var user = {};

var createUser = function() {
  return users.create({
    username: 'testuser',
    email: 'testuser@gmail.com',
    password: 'password',
    confirmation: 'password'
  })
  .then(function(newUser) { user = newUser; });
};

var createBoard = function (index) {
  return boards.create({
    name: 'Board ' + index,
    description: 'Hello World! This is board ' + index + ' in a popular forum.'
  });
};

var createThread = function(boardId, index) {
  return threads.create({
    title: 'Thread ' + index,
    body: 'Hello World! This is thread ' + index,
    board_id: boardId
  });
};

var createPost = function(threadId, index) {
  return posts.create({
    title: 'Post ' + index,
    body: 'Hello World! This is post ' + index,
    thread_id: threadId,
    user_id: user.id
  });
};

module.exports = function(numBoards, numThreads, numPosts, cb) {
  var boardIndexes = _.range(numBoards);
  var threadIndexes = _.range(numThreads);
  var postIndexes = _.range(numPosts);

  return createUser().then(function() {
    return Promise.each(boardIndexes, function(boardIndex) {
      return createBoard(boardIndex)
      .then(function(board) {
        return Promise.each(threadIndexes, function(threadIndex) {
          return createThread(board.id, threadIndex)
          .then(function(thread) {
            return Promise.each(postIndexes, function(postIndex) {
              return createPost(thread.id, postIndex);
            });
          });
        });
      });
    })
    .then(function() { return cb(); })
    .catch(function(err) { return cb(err); });
  });
};
