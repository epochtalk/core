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
    boards.create(testBoard).then(function(board) {
      t.ok(board, 'board returned from create is truthy');
      t.equal(testBoard.name, board.name, 'board name is correct');
      t.equal(testBoard.description, board.description, 'board description is correct');
      t.end();
    });
  });
  test('create parent/children', function(t) {
    var parentBoard = { name: 'Parent Board', description: 'Description' };
    var childABoard = { name: 'Child A Board', description: 'Description' };
    var childBBoard = { name: 'Child B Board', description: 'Description' };
    boards.create(parentBoard).then(function(board) {
      parentBoard = board;
      childABoard.parent_id = parentBoard.id;
      childBBoard.parent_id = parentBoard.id;

      return boards.create(childABoard)
      .then(function(board) {
        childABoard = board;
      })
      .then(function() {
        return boards.create(childBBoard)
        .then(function(board) {
          childBBoard = board;
        });
      })
      .then(function() {
        return boards.find(parentBoard.id)
        .then(function(board) {
          t.equal(board.name, parentBoard.name, 'parent board name is correct');
          t.equal(board.description, parentBoard.description, 'board description is correct');
          t.end();
          teardown();
        });
      });
    });
  });
};

function teardown() {
  rimraf(dbPath, function(error){
    console.log('teardown: removed ' + dbPath);
  });
};
