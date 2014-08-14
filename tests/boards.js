var assert = require('assert');
var rimraf = require('rimraf');
var path = require('path');
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);
var boards = core.boards;
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var emptyCb = function() {};
var savedBoard;
var oldBoardId, newBoardId;

seed.initDb('test-epoch.db');

describe('boards', function() {
  describe('#ALL', function() {
    it('should return all board records in db', function(done) {
      seed.createBoards(25, function() {
        boards.all()
        .then(function(allBoards) {
          for (var i = 0; i < allBoards.length; i++) {
            assert.equal('Board ' + i, allBoards[i].name);
            assert.equal('Hello World! This is board ' + i + ' in a popular forum.', allBoards[i].description);
            boards.delete(allBoards[i].id, emptyCb);
          }
          done();
        })
        .catch(function(err) {
          done(err);
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
      boards.create(testBoard)
      .then(function(board) {
        assert.equal(board.name, testBoard.name);
        assert.equal(board.description, testBoard.description);
        savedBoard = board;
        done();
      })
      .catch(function(err) {
        done(err);
      });
    });
  });
});

describe('boards', function() {
  describe('#FIND', function() {
    it('should find specified board', function(done) {
      boards.find(savedBoard.id)
      .then(function(board){
        assert.equal(board.name, savedBoard.name);
        assert.equal(board.description, savedBoard.description);
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
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
      boards.update(savedBoard)
      .then(function(board) {
        assert.equal(board.name, newName);
        assert.equal(board.description, newDesc);
        return savedBoard.id;
      })
      .then(boards.find)
      .then(function(board) {
        assert.equal(board.name, newName);
        assert.equal(board.description, newDesc);
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
      });
    });
  });
});

describe('boards', function() {
  describe('#IMPORT', function() {
    it('should import a board', function(done) {
      oldBoardId = 111;
      var importBoard = {
        name: 'import name',
        description: 'import description',
        smf: {
          board_id: oldBoardId,
        }
      };

      boards.import(importBoard)
      .then(function(board) {
        assert.equal(board.name, importBoard.name);
        assert.equal(board.description, importBoard.description);
        assert.equal(board.smf.board_id, importBoard.smf.board_id);
        assert.notEqual(board.id, undefined);
        newBoardId = board.id;
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
      });
    });
  });
});

describe('boards', function() {
  describe('#IMPORT_GET', function() {
    it('should verify key mapping for imported boards', function(done) {
      boards.boardByOldId(oldBoardId)
      .then(function(newId) {
        assert.equal(newId, newBoardId);
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
      });
    });
  });
});

describe('boards', function() {
  describe('#IMPORT_DELETE', function() {
    it('should delete all imported boards key mappings', function(done) {
      boards.delete(newBoardId)
      .then(function(board) {
        return board.id;
      })
      .then(boards.boardByOldId)
      .catch(function(err) {
        assert.notEqual(err, null);
        done(null); // expecting an error
      });
    });
  });
});

describe('boards', function() {
  describe('#DELETE', function() {
    it('should delete the specified board', function(done) {
      boards.delete(savedBoard.id)
      .then(function(board) {
        assert.equal(board.name, savedBoard.name);
        assert.equal(board.description, savedBoard.description);
        return board.id;
      })
      .then(boards.find)
      .catch(function(err) {
        assert.notEqual(err, null);
        done(null); // error, because board should have been deleted
      });
    });
  });
});

after(function(done) {
  rimraf(path.join(__dirname, '..', dbName), function(err) {
    if (err) { console.log(err); }
    done();
  });
});

