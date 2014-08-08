var path = require('path');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
var boards = require(path.join(__dirname, '..', 'boards'));
var threads = require(path.join(__dirname, '..', 'threads'));
var posts = require(path.join(__dirname, '..', 'posts'));
var threadIds = [];
var threadIndexIds = [];
var boardIds = [];
var postIds = [];
var threadIndex = 0;
var threadUpdateIndex = 0;
var boardIndex = 0;
var boardUpdateIndex = 0;
var boardDeleteIndex = 0;
var postUpdateIndex = 0;
var postDeleteIndex = 0;

suite.add('Boards#Create', {
  defer: true,
  fn: function(deferred) {
    boards.create({
      name: 'Board',
      description: 'Hello World! This is a board in a popular forum.'
    },
    function(err, board) {
      if (!err) {
        boardIds.push(board.id);
      }
      deferred.resolve();
    });
  }
})
.add('Boards#Update', {
  defer: true,
  fn: function(deferred) {
    boards.update({
      name: 'Board Update!',
      description: 'Updated! Hello World! This is a board in a popular forum.',
      id: boardIds[boardUpdateIndex++]
    },
    function() {
      deferred.resolve();
    });
  }
})
.add('Threads#Create', {
  defer: true,
  fn: function(deferred) {
    threads.create({
      title: 'Thread',
      body: 'Hello World! This is a thread in a board on a popular forum.',
      board_id: boardIds[boardIndex++]
    },
    function(err, thread) {
      if (!err) {
        threadIds.push(thread.thread_id);
        threadIndexIds.push(thread.id);
      }
      deferred.resolve();
    });
  }
})
.add('Threads#Update', {
  defer: true,
  fn: function(deferred) {
    threads.update({
      post_count: 99,
      id: threadIndexIds[threadUpdateIndex++],
    },
    function(err, thread) {
      if (!err) {
        threadIds.push(thread.thread_id);
      }
      deferred.resolve();
    });
  }
})
.add('Posts#Create', {
  defer: true,
  fn: function(deferred) {
    posts.create({
      title: 'Post',
      body: 'Hello World! This is a post in a thread on a popular forum.',
      thread_id: threadIds[threadIndex++]
    },
    function(err, post) {
      if (!err) {
        postIds.push(post.id);
      }
      deferred.resolve();
    });
  }
})
.add('Posts#Update', {
  defer: true,
  fn: function(deferred) {
    posts.update({
      title: 'Post Updated!',
      body: 'Updated! Hello World! This is a post in a thread on a popular forum.',
      id: postIds[postUpdateIndex++]
    },
    function() {
      deferred.resolve();
    });
  }
})
.add('Posts#Delete', {
  defer: true,
  fn: function(deferred) {
    posts.delete(postIds[postDeleteIndex++], function(err) {
      if (!err) {
        deferred.resolve();
      }
    });
  }
})
.add('Boards#Delete', {
  defer: true,
  fn: function(deferred) {
    boards.delete(boardIds[boardDeleteIndex++], function(err) {
      if (!err) {
        deferred.resolve();
      }
    });
  }
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  console.log('Slowest is ' + this.filter('slowest').pluck('name'));
})
// run async
.run({ 'async': true });
