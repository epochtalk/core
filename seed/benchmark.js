var path = require('path');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
var core = require(path.join(__dirname, '..')('.benchmarkDB'));
var boards = core.boards;
var threads = core.threads;
var posts = core.posts;
var threadIds = [];
var threadIndexIds = [];
var boardIds = [];
var postIds = [];
var index = 0;

suite.add('Boards#Create', {
  defer: true,
  fn: function(deferred) {
    boards.create({
      name: 'Board',
      description: 'Hello World! This is a board in a popular forum.'
    })
    .then(function(board) {
      boardIds.push(board.id);
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
      id: boardIds[index++]
    })
    .then(function() {
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
      board_id: boardIds[index++]
    })
    .then(function(thread) {
      threadIds.push(thread.thread_id);
      threadIndexIds.push(thread.thread_id);
      deferred.resolve();
    });
  }
})
.add('Threads#Update', {
  defer: true,
  fn: function(deferred) {
    var threadId = threadIndexIds[index++];
    threads.update({
      post_count: 99,
      id: threadId
    })
    .then(function(thread) {
      threadIds.push(thread.thread_id);
      deferred.resolve();
    })
    .catch(function() {
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
      thread_id: threadIds[index++]
    })
    .then(function(post) {
      postIds.push(post.id);
      deferred.resolve();
    })
    .catch(function() {
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
      id: postIds[index++]
    })
    .then(function() {
      deferred.resolve();
    })
    .catch(function() {
      deferred.resolve();
    });
  }
})
.add('Posts#Delete', {
  defer: true,
  fn: function(deferred) {
    posts.delete(postIds[index++])
    .then(function() {
      deferred.resolve();
    })
    .catch(function() {
      deferred.resolve();
    });
  }
})
.add('Boards#Delete', {
  defer: true,
  fn: function(deferred) {
    boards.delete(boardIds[index++])
    .then(function() {
      deferred.resolve();
    });
  }
})
.on('cycle', function(event) {
  index = 0;
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  console.log('Slowest is ' + this.filter('slowest').pluck('name'));
  console.log('Remember to clear your DB!');
})
// run async
.run({ 'async': true });
