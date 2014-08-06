var path = require('path');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
var boards = require(path.join(__dirname, '..', 'boards', 'boards'));
var threads = require(path.join(__dirname, '..', 'threads', 'threads'));
var posts = require(path.join(__dirname, '..', 'posts', 'posts'));

suite.add('Boards#Create', {
  defer: true,
  fn: function(deferred) {
    boards.create({
      name: 'Board',
      description: 'Hello World! This is a board in a popular forum.'
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
      board_id: 'boards~abcdefghijklmnopqrstuvwxyz'},
    function() {
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
      thread_id: 'threads~abcdefghijklmnopqrstuvwxyz'},
    function() {
      deferred.resolve();
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
