var test = require('tape');
var rimraf = require('rimraf');
var path = require('path');
var Promise = require('bluebird');
var dbPath = path.join('/', 'tmp', '.epochdb');
var core = require(path.join(__dirname, '..'))(dbPath);
var probe = require(path.join(__dirname, '..', 'probe'));
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var boards = core.boards;

var seedCount = 25;
seed(seedCount, 0, 0, start);

function start() {
  test('seed/query', function(t) {
    boards.all().then(function(allBoards) {
      t.equal(allBoards.length, seedCount);
      t.end();
      teardown();
    });
  });
};

function teardown() {
  rimraf(dbPath, function(error){
    console.log('teardown: removed ' + dbPath);
  });
};
