var path = require('path');
var seed = require(path.join(__dirname, 'seed'));

var boardCount = process.argv[2] || 5;
var threadsCount = process.argv[3] || 5;
var postsCount = process.argv[4] || 5;

seed(boardCount, threadsCount, postsCount, function() {
  console.log('Seeding Complete:');
  console.log(' * Total Boards:\t' + boardCount);
  console.log(' * Total Threads:\t' + threadsCount * boardCount);
  console.log(' * Total Posts:\t\t' + postsCount * threadsCount * boardCount);
});