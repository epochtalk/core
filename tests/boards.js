var assert = require('assert');
var boards = require(__dirname + '/../boards');
var seed = require(__dirname + '/../seed/seed');
var emptyCb = function() {};
var savedBoard;

describe('boards', function() {
  describe('#ALL', function() {
    it('should return all board records in db', function(done) {
      seed.createBoards(25, function() {
        boards.all(function(err, allBoards) {
          if (!err) {
            for (var i = 0; i < allBoards.length; i++) {
              var end = allBoards.length - i - 1;
              assert.equal('Board ' + i, allBoards[end].name);
              assert.equal('Hello World! This is board ' + i + ' in a popular forum.', allBoards[end].description);
              boards.delete(allBoards[end].id, emptyCb);
            }
            done();
          }
        });
      });
    });
  });
});

describe('boards', function() {
  describe('#CREATE', function() {
    it('should create and return the created board', function(done) {
      var testBoard = {
        name: 'Test Board',
        description: 'Test Board Description'
      };
      boards.create(testBoard, function(err, board) {
        if (!err) {
          assert.equal(board.name, testBoard.name);
          assert.equal(board.description, testBoard.description);
          savedBoard = board;
          done();
        }
      });
    });
  });
});

describe('boards', function() {
  describe('#FIND', function() {
    it('should find specified board', function(done) {
      boards.find(savedBoard.id, function(err, board) {
        if (!err) {
          assert.equal(board.name, savedBoard.name);
          assert.equal(board.description, savedBoard.description);
          done();
        }
      });
    });
  });
});

describe('boards', function() {
  describe('#UPDATE', function() {
    it('should update specified board', function(done) {
      var newName = 'Update Check 1';
      var newDesc = 'Update Check 2';
      savedBoard.name = newName;
      savedBoard.description = newDesc;
      boards.update(savedBoard, function(err, board) {
        if (!err) {
          assert.equal(board.name, newName);
          assert.equal(board.description, newDesc);
          boards.find(savedBoard.id, function(err) {
            if (!err) {
              assert.equal(board.name, newName);
              assert.equal(board.description, newDesc);
              done();
            }
          });
        }
      });
    });
  });
});

describe('boards', function() {
  describe('#DELETE', function() {
    it('should delete the specified board', function(done) {
      boards.delete(savedBoard.id, function(err, board) {
        if (!err) {
          assert.equal(board.name, savedBoard.name);
          assert.equal(board.description, savedBoard.description);
          boards.find(savedBoard.id, function(err) {
            var expectedErr = 'Key not found in database [board~' + savedBoard.id + ']';
            assert.equal(err.message, expectedErr);
            done();
          });
        }
      });
    });
  });
});