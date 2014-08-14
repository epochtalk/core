var path = require('path');
var rimraf = require('rimraf');
var chai = require('chai');
var assert = chai.assert;
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);
var config = require(path.join(__dirname, '..', 'config'));
var boards = core.boards;
var Board = require(path.join(__dirname, '..', 'models', 'boards'));

var boardObj = {
  name: 'Board',
  description: 'Board Description',
};

var childBoardObjA = {
  name: 'Child A',
  description: 'Child Description A',
};

var childBoardObjB = {
  name: 'Child B',
  description: 'Child Description B',
};

var parentBoard;
var childBoards = [];

describe('Board', function() {
  // THIS WILL CHANGE
  // Once the Board model is implemented into the CRUD routes.
  before(function(done) {
    boards.create(boardObj) // Create parent board
    .then(function(dbParentBoard) {
      parentBoard = dbParentBoard;
      childBoardObjA.parent_id = parentBoard.id;
      childBoardObjB.parent_id = parentBoard.id;
      boards.create(childBoardObjA) // Create child board a
      .then(function(dbChildBoardA) {
        childBoards.push(dbChildBoardA);
        parentBoard.children_ids = [];
        parentBoard.children_ids.push(dbChildBoardA.id);
        boards.create(childBoardObjB) // Create child board b
        .then(function(dbChildBoardB) {
          childBoards.push(dbChildBoardB);
          parentBoard.children_ids.push(dbChildBoardB.id);
          boards.update(parentBoard) // Update parent board with child boards
          .then(function(updatedParentBoard) {
            parentBoard = updatedParentBoard;
            done();
          });
        });
      });
    });
  });

  describe('#new', function() {
    it('should create a Board object', function() {
      var board = new Board(boardObj);
      assert.isObject(board);

      assert.equal(board.name, boardObj.name);
      assert.equal(board.description, boardObj.description);

      assert.property(board, 'created_at');
      assert.property(board, 'updated_at');
      assert.property(board, 'id');
      assert.property(board, 'name');
      assert.property(board, 'description');
      assert.isUndefined(board.children_ids);
      assert.isUndefined(board.parent_id);

      assert.isString(board.id);
      assert.isString(board.name);
      assert.isString(board.description);
      assert.isNumber(board.created_at);
      assert.isNumber(board.updated_at);
    });
    it('should create a parent Board object', function() {
      var board = new Board(parentBoard);
      assert.isObject(board);

      assert.equal(board.name, boardObj.name);
      assert.equal(board.description, boardObj.description);

      assert.property(board, 'created_at');
      assert.property(board, 'updated_at');
      assert.property(board, 'id');
      assert.property(board, 'name');
      assert.property(board, 'description');
      assert.property(board, 'children_ids');

      assert.isString(board.id);
      assert.isString(board.name);
      assert.isString(board.description);
      assert.isNumber(board.created_at);
      assert.isNumber(board.updated_at);
      assert.isArray(board.children_ids);
    });
    it('should create a child Board object', function() {
      var childBoard = childBoards[0];
      var board = new Board(childBoards[0]);
      assert.isObject(board);

      assert.equal(board.name, childBoard.name);
      assert.equal(board.description, childBoard.description);
      assert.equal(board.parent_id, childBoard.parent_id);

      assert.property(board, 'created_at');
      assert.property(board, 'updated_at');
      assert.property(board, 'id');
      assert.property(board, 'name');
      assert.property(board, 'description');
      assert.property(board, 'parent_id');

      assert.isString(board.id);
      assert.isString(board.name);
      assert.isString(board.description);
      assert.isString(board.parent_id);
      assert.isNumber(board.created_at);
      assert.isNumber(board.updated_at);
    });
  });

  describe('#getKey', function() {
    it('should return the board\'s key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var board = new Board(boardObj);
      var key = board.getKey();
      assert.isDefined(key);
      assert.isString(key);
      assert.equal(key, boardPrefix + sep + board.id);
    });
  });

  describe('#getLegacyKey', function() {
    it('should return the board\'s legacy key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      boardObj.smf = { board_id: '0123456789' };
      var board = new Board(boardObj);
      var key = board.getLegacyKey();
      assert.isDefined(key);
      assert.isString(key);
      assert.equal(key, boardPrefix + sep + board.smf.board_id);
    });
  });


  describe('#getChildren', function() {
    it('should return the board\'s children', function(done) {
      var board = new Board(parentBoard);
      board.getChildren()
      .then(function(children) {
        assert.isDefined(children);
        assert.isArray(children);
        assert.lengthOf(children, 2);
        assert.isDefined(children[0]);
        assert.isObject(children[0]);
        assert.equal(children[0].name, childBoards[0].name);
        assert.equal(children[0].description, childBoards[0].description);
        assert.equal(children[0].id, childBoards[0].id);
        assert.equal(children[0].created_at, childBoards[0].created_at);
        assert.equal(children[0].parent_id, childBoards[0].parent_id);

        assert.isDefined(children[1]);
        assert.isObject(children[1]);
        assert.equal(children[1].name, childBoards[1].name);
        assert.equal(children[1].description, childBoards[1].description);
        assert.equal(children[1].id, childBoards[1].id);
        assert.equal(children[1].created_at, childBoards[1].created_at);
        assert.equal(children[1].parent_id, childBoards[1].parent_id);
        done();
      });
    });
  });

  describe('#getParent', function() {
    it('should return the board\'s parent', function(done) {
      var board = new Board(childBoards[0]);
      board.getParent()
      .then(function(parent) {
        assert.isDefined(parent);
        assert.isObject(parent);
        assert.equal(parent.name, parentBoard.name);
        assert.equal(parent.description, parentBoard.description);
        assert.equal(parent.id, parentBoard.id);
        assert.equal(parent.id, board.parent_id);
        assert.equal(parent.created_at, parentBoard.created_at);
        assert.equal(parent.parent_id, parentBoard.parent_id);
        assert.isArray(parent.children_ids);
        assert.deepEqual(parent.children_ids, parentBoard.children_ids);
        done();
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), function(err) {
      if (err) { console.log(err); }
      done();
    });
  });

});