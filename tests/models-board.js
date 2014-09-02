var rimraf = require('rimraf');
var should = require('chai').should();
var dbName = 'test-epoch.db';
var path = require('path');
var core = require(path.join(__dirname, '..'))(dbName);
var boards = core.boards;
var Board = require(path.join(__dirname, '..', 'boards', 'model'));
var config = require(path.join(__dirname, '..', 'config'));

describe('Board', function() {

  describe('#new', function() {
    var plainBoard = {
      name: 'Board',
      description: 'Board Description'
    };

    var parentBoard = {
      name: 'Parent Board',
      description: 'Parent Board Description'
    };

    var childBoardA = {
      name: 'Child A',
      description: 'Child A Description'
    };

    var childBoardB = {
      name: 'Child B',
      description: 'Child B Description'
    };

    before(function() {
      return boards.create(parentBoard) // Create parent board
      .then(function(board) {
        parentBoard = board;
        childBoardA.parent_id = parentBoard.id;
        childBoardB.parent_id = parentBoard.id;
        return childBoardA;
      })
      .then(boards.create) // Create child board a
      .then(function(board) {
        childBoardA = board;
        parentBoard.children_ids = [];
        parentBoard.children_ids.push(childBoardA.id);
        return childBoardB;
      })
      .then(boards.create) // Create child board b
      .then(function(board) {
        childBoardB = board;
        parentBoard.children_ids.push(childBoardB.id);
        return parentBoard;
      })
      .then(boards.update) // Update parent board with child boards
      .then(function(updatedParentBoard) {
        parentBoard = updatedParentBoard;
      });
    });

    it('should create a plain Board object', function() {
      var board = new Board(plainBoard);
      board.should.be.a('object');
      should.not.exist(board.id);
      should.not.exist(board.created_at);
      should.not.exist(board.updated_at);
      should.not.exist(board.imported_at);
      should.not.exist(board.deleted);
      board.name.should.equal(plainBoard.name);
      board.description.should.equal(plainBoard.description);
      should.not.exist(board.smf);
      should.not.exist(board.parent_id);
      should.not.exist(board.children_ids);
      should.not.exist(board.children);
    });

    it('should create a parent Board object', function() {
      var board = new Board(parentBoard);
      board.should.be.a('object');
      board.id.should.be.ok;
      board.id.should.be.a('string');
      board.created_at.should.be.a('number');
      board.updated_at.should.be.a('number');
      should.not.exist(board.imported_at);
      should.not.exist(board.deleted);
      board.name.should.equal(parentBoard.name);
      board.description.should.equal(parentBoard.description);
      should.not.exist(board.smf);
      should.not.exist(board.parent_id);
      board.children_ids.should.be.an('array');
      board.children_ids.should.have.length(2);
      should.not.exist(board.children);
    });

    it('should create a child Board object', function() {
      var board = new Board(childBoardA);
      board.should.be.a('object');
      board.id.should.be.ok;
      board.id.should.be.a('string');
      board.created_at.should.be.a('number');
      board.updated_at.should.be.a('number');
      should.not.exist(board.imported_at);
      should.not.exist(board.deleted);
      board.name.should.equal(childBoardA.name);
      board.description.should.equal(childBoardA.description);
      should.not.exist(board.smf);
      board.parent_id.should.equal(parentBoard.id);
      should.not.exist(board.children_ids);
      should.not.exist(board.children);
    });
  });

  describe('#key', function() {
    var plainBoard = {
      name: 'Board',
      description: 'Board Description'
    };

    before(function() {
      return boards.create(plainBoard)
      .then(function(board) {
        plainBoard = board;
      });
    });

    it('should return the board\'s key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;

      var board = new Board(plainBoard);
      var key = board.key();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + board.id);
    });
  });

  describe('#keyFromId', function() {
    it('should return the board\'s key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Board.keyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + fakeId);
    });
  });

  describe('#postCountKeyFromId', function() {
    it('should return the board\'s post count key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Board.postCountKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + fakeId + sep + 'post_count');
    });
  });

  describe('#threadCountKeyFromId', function() {
    it('should return the board\'s thread count key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Board.threadCountKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + fakeId + sep + 'thread_count');
    });
  });

  describe('#lastPostUsernameKeyFromId', function() {
    it('should return the board\'s last post username key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Board.lastPostUsernameKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + fakeId + sep + 'last_post_username');
    });
  });

  describe('#lastPostCreatedAtKeyFromId', function() {
    it('should return the board\'s last post created at key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Board.lastPostCreatedAtKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + fakeId + sep + 'last_post_created_at');
    });
  });

  describe('#lastThreadTitleKeyFromId', function() {
    it('should return the board\'s last thread title key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Board.lastThreadTitleKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + fakeId + sep + 'last_thread_title');
    });
  });

  describe('#legacyKey', function() {
    var plainBoard = {
      name: 'Board',
      description: 'Board Description',
      smf: {
        ID_BOARD: '0123456789'
      }
    };

    before(function() {
      return boards.create(plainBoard)
      .then(function(board) {
        plainBoard = board;
      });
    });

    it('should return the board\'s legacy key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;

      var board = new Board(plainBoard);
      var key = board.legacyKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + board.smf.ID_BOARD);
    });
  });

  describe('#legacyKeyFromId', function() {
    it('should return the board\'s legacy key', function() {
      var boardPrefix = config.boards.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Board.legacyKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(boardPrefix + sep + fakeId);
    });
  });

  describe('#getChildren', function() {
    var parentBoard = {
      name: 'Parent Board',
      description: 'Parent Board Description'
    };

    var childBoardA = {
      name: 'Child A',
      description: 'Child A Description'
    };

    var childBoardB = {
      name: 'Child B',
      description: 'Child B Description'
    };

    before(function() {
      return boards.create(parentBoard) // Create parent board
      .then(function(board) {
        parentBoard = board;
        childBoardA.parent_id = parentBoard.id;
        childBoardB.parent_id = parentBoard.id;
        return childBoardA;
      })
      .then(boards.create) // Create child board a
      .then(function(board) {
        childBoardA = board;
        parentBoard.children_ids = [];
        parentBoard.children_ids.push(childBoardA.id);
        return childBoardB;
      })
      .then(boards.create) // Create child board b
      .then(function(board) {
        childBoardB = board;
        parentBoard.children_ids.push(childBoardB.id);
        return parentBoard;
      })
      .then(boards.update) // Update parent board with child boards
      .then(function(updatedParentBoard) {
        parentBoard = updatedParentBoard;
      });
    });

    it('should return the board\'s children', function() {
      var board = new Board(parentBoard);
      return board.getChildren()
      .then(function(children) {

        children.should.be.ok;
        children.should.be.an('array');
        children.should.have.length(2);

        var childA = children[0];
        childA.should.be.a('object');
        childA.id.should.be.ok;
        childA.id.should.be.a('string');
        childA.created_at.should.be.a('number');
        childA.updated_at.should.be.a('number');
        should.not.exist(childA.imported_at);
        should.not.exist(childA.deleted);
        childA.name.should.equal(childBoardA.name);
        childA.description.should.equal(childBoardA.description);
        should.not.exist(childA.smf);
        childA.parent_id.should.equal(parentBoard.id);
        should.not.exist(childA.children_ids);
        should.not.exist(childA.children);

        var childB = children[1];
        childB.should.be.a('object');
        childB.id.should.be.ok;
        childB.id.should.be.a('string');
        childB.created_at.should.be.a('number');
        childB.updated_at.should.be.a('number');
        should.not.exist(childB.imported_at);
        should.not.exist(childB.deleted);
        childB.name.should.equal(childBoardB.name);
        childB.description.should.equal(childBoardB.description);
        should.not.exist(childB.smf);
        childB.parent_id.should.equal(parentBoard.id);
        should.not.exist(childB.children_ids);
        should.not.exist(childB.children);
      });
    });
  });

  describe('#getParent', function() {
    var parentBoard = {
      name: 'Parent Board',
      description: 'Parent Board Description'
    };

    var childBoardA = {
      name: 'Child A',
      description: 'Child A Description'
    };

    before(function() {
      return boards.create(parentBoard) // Create parent board
      .then(function(board) {
        parentBoard = board;
        childBoardA.parent_id = parentBoard.id;
        return childBoardA;
      })
      .then(boards.create) // Create child board a
      .then(function(board) {
        childBoardA = board;
        parentBoard.children_ids = [childBoardA.id];
        return parentBoard;
      })
      .then(boards.update) // Update parent board with child boards
      .then(function(updatedParentBoard) {
        parentBoard = updatedParentBoard;
      });
    });

    it('should return the board\'s parent', function() {
      var board = new Board(childBoardA);
      return board.getParent()
      .then(function(parent) {
        parent.should.be.a('object');
        parent.id.should.be.ok;
        parent.id.should.be.a('string');
        parent.id.should.equal(parentBoard.id);
        parent.created_at.should.be.a('number');
        parent.updated_at.should.be.a('number');
        should.not.exist(parent.imported_at);
        should.not.exist(parent.deleted);
        parent.name.should.equal(parentBoard.name);
        parent.description.should.equal(parentBoard.description);
        should.not.exist(parent.smf);
        should.not.exist(parent.parent_id);
        parent.children_ids.should.be.an('array');
        parent.children_ids.should.have.length(1);
        should.not.exist(parent.children);
      });
    });
  });

  describe('#validate', function() {

    it('should validate the minimum board model', function() {
      var minBoard = { name: 'name' };
      var board = new Board(minBoard);
      var validBoard = board.validate().value();
      validBoard.should.exist;
    });

    it('should validate that name is required', function() {
      var nameBoard = { description: 'hello' };
      var board = new Board(nameBoard);
      return board.validate()
      .catch(function(err) {
        err.should.exist;
      });
    });

    it('should validate dates are numbers', function() {
      var dateBoard = {
        name: 'name',
        created_at: 12312312,
        updated_at: 13124121,
        imported_at: 12314124
      };
      var board = new Board(dateBoard);
      var validBoard = board.validate().value();
    });

    it('should validate ids are string', function() {
      var idBoard = {
        name: 'name',
        id: '121314',
        parent_id: '1203234'
      };
      var board = new Board(idBoard);
      var validBoard = board.validate().value();
      validBoard.should.exist;
    });

    it('should validate children and chlidren_ids are arrays', function() {
      var idBoard = {
        name: 'name',
        children: [{ name: 'child' }],
        children_ids: ['asdasdf']
      };
      var board = new Board(idBoard);
      var validBoard = board.validate().value();
      validBoard.should.exist;
    });

    it('should validate deleted is a boolean', function() {
      var idBoard = {
        name: 'name',
        deleted: true
      };
      var board = new Board(idBoard);
      var validBoard = board.validate().value();
      validBoard.should.exist;
    });

    it('should validate smf id is a number', function() {
      var idBoard = {
        name: 'name',
        smf: {
          ID_BOARD: 1235
        }
      };
      var board = new Board(idBoard);
      var validBoard = board.validate().value();
      validBoard.should.exist;
    });
  });

  describe('#simple', function() {
    var fullBoard = {
      created_at: 212424525,
      updated_at: 342523422,
      imported_at: 2323424234,
      id: 'asdflkalskdfa',
      name: 'Board',
      description: 'Board Description',
      parent_id: 'alsdkfjlaksdjfa',
      children_ids: ['asdflkjaslkf', 'alsdkfjasdf'],
      children: [{ name: 'first' }, { name: 'second' }],
      deleted: true,
      smf: {
        ID_BOARD: 234235
      }
    };

    it('should return a simple version of the board', function() {
      var board = new Board(fullBoard);
      board.children = fullBoard.children;
      var simpleBoard = board.simple();
      simpleBoard.id.should.equal(fullBoard.id);
      simpleBoard.name.should.equal(fullBoard.name);
      simpleBoard.description.should.equal(fullBoard.description);
      simpleBoard.created_at.should.equal(fullBoard.created_at);
      simpleBoard.updated_at.should.equal(fullBoard.updated_at);
      simpleBoard.imported_at.should.equal(fullBoard.imported_at);
      simpleBoard.parent_id.should.equal(fullBoard.parent_id);
      simpleBoard.children_ids.should.be.an('array');
      simpleBoard.children_ids[0].should.equal(fullBoard.children_ids[0]);
      simpleBoard.deleted.should.be.true;
      simpleBoard.smf.ID_BOARD.should.equal(fullBoard.smf.ID_BOARD);
      simpleBoard.children.should.be.an('array');

      should.not.exist(simpleBoard.key);
      should.not.exist(simpleBoard.legacyKey);
      should.not.exist(simpleBoard.getChildren);
      should.not.exist(simpleBoard.getParent);
      should.not.exist(simpleBoard.validate);
      should.not.exist(simpleBoard.simple);
      should.not.exist(simpleBoard.keyFromId);
      should.not.exist(simpleBoard.legacyKeyFromId);
      should.not.exist(simpleBoard.prefix);
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });

});
