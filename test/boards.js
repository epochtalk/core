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
    });
  });
  test('create', function(t) {
    var testBoard = {
      name: 'Test Board',
      description: 'Test Board Description'
    };
    boards.create(testBoard).
    then(function(board) {
      t.ok(board, 'board returned from create is truthy');
      t.equal(testBoard.name, board.name, 'board name is correct');
      t.equal(testBoard.description, board.description, 'board description is correct');
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
