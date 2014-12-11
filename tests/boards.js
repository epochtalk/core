var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
var Promise = require('bluebird');
var dbName = '.testDB';
var core = require(path.join(__dirname, '..'))(dbName);
var probe = require(path.join(__dirname, '..', 'probe'));
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var boards = core.boards;
var _ = require('lodash');

describe('boards', function() {

  describe('#ALL', function() {
    before(function(done) {
      seed(25, 0, 0, done);
    });
    it('should return 25 boards', function() {
      return boards.all()
      .then(function(allBoards) {
        allBoards.should.have.length(25);
      });
    });
  });

  describe('#CREATE', function() {
    var testBoard = {
      name: 'Test Board',
      description: 'Test Board Description'
    };

    it('should create and return the created board', function() {
      return boards.create(testBoard)
      .then(function(board) {
        board.id.should.be.ok;
        board.id.should.be.a('string');
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(testBoard.name);
        board.description.should.equal(testBoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });
  });

  describe('#CREATE-PARENT-CHILDREN', function() {
    var parentBoard = { name: 'Parent Board', description: 'Description' };
    var childABoard = { name: 'Child A Board', description: 'Description' };
    var childBBoard = { name: 'Child B Board', description: 'Description' };

    before(function() {
      return boards.create(parentBoard)
      .then(function(board) {
        parentBoard = board;
      });
    });

    it('should create two children boards and update parent', function() {
      childABoard.parent_id = parentBoard.id;
      childBBoard.parent_id = parentBoard.id;

      return boards.create(childABoard)
      .then(function(board) {
        board.id.should.be.ok;
        board.id.should.be.a('string');
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(childABoard.name);
        board.description.should.equal(childABoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.children);

        childABoard = board;
      })
      .then(function() {
        return boards.create(childBBoard)
        .then(function(board) {
          board.id.should.be.ok;
          board.id.should.be.a('string');
          board.created_at.should.be.a('number');
          board.updated_at.should.be.a('number');
          should.not.exist(board.imported_at);
          should.not.exist(board.deleted);
          board.name.should.equal(childBBoard.name);
          board.description.should.equal(childBBoard.description);
          should.not.exist(board.smf);
          should.not.exist(board.children);

          childBBoard = board;
        });
      })
      .then(function() {
        return boards.find(parentBoard.id)
        .then(function(board) {
          board.id.should.equal(parentBoard.id);
          board.created_at.should.equal(parentBoard.created_at);
          board.updated_at.should.be.a('number');
          should.not.exist(board.imported_at);
          should.not.exist(board.deleted);
          board.name.should.equal(parentBoard.name);
          board.description.should.equal(parentBoard.description);
          should.not.exist(board.smf);
          board.children.should.be.an('array');
          board.children.should.have.length(2);
          var childrenIds = _.map(board.children, function(b) { return b.id });
          childrenIds.should.include(childABoard.id);
          childrenIds.should.include(childBBoard.id);
        });
      });
    });
  });

  describe('#IMPORT', function() {
    var importBoard = {
      name: 'import name',
      description: 'import description',
      smf: { ID_BOARD: 111 }
    };

    var importChildBoard = {
      name: 'import child name',
      description: 'import child description',
      smf: {
        ID_BOARD: 112,
        ID_PARENT: 111
      }
    };

    it('should import a board', function() {
      return boards.import(importBoard)
      .then(function(board) {
        importBoard = board;
        board.id.should.be.ok;
        board.id.should.be.a('string');
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        board.imported_at.should.be.a('number');
        should.not.exist(board.deleted);
        board.name.should.equal(importBoard.name);
        board.description.should.equal(importBoard.description);
        board.smf.ID_BOARD.should.equal(importBoard.smf.ID_BOARD);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });

    it('should import a child board', function() {
      return boards.import(importChildBoard) // verify child gets parent board's id
      .then(function(board) {
        importChildBoard = board;
        board.id.should.be.ok;
        board.id.should.be.a('string');
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        board.imported_at.should.be.a('number');
        should.not.exist(board.deleted);
        board.name.should.equal(importChildBoard.name);
        board.description.should.equal(importChildBoard.description);
        board.smf.ID_BOARD.should.equal(importChildBoard.smf.ID_BOARD);
        board.smf.ID_PARENT.should.equal(importChildBoard.smf.ID_PARENT);
        board.parent_id.should.be.ok;
        board.parent_id.should.be.a('string');
        board.parent_id.should.equal(importBoard.id)
        return boards.find(importBoard.id);
      })
      .then(function(parentBoard) { // verify parent is aware of child after import
        parentBoard.id.should.be.ok;
        parentBoard.id.should.be.a('string');
        parentBoard.created_at.should.be.a('number');
        parentBoard.updated_at.should.be.a('number');
        parentBoard.imported_at.should.be.a('number');
        should.not.exist(parentBoard.deleted);
        parentBoard.name.should.equal(importBoard.name);
        parentBoard.description.should.equal(importBoard.description);
        parentBoard.smf.ID_BOARD.should.equal(importBoard.smf.ID_BOARD);
        should.not.exist(parentBoard.parent_id);
        parentBoard.children.should.be.an('array');
        parentBoard.children.should.have.length(1);
        parentBoard.children[0].id.should.equal(importChildBoard.id);
      });
    });
  });

  describe('#IMPORT_GET', function() {
    var importBoard = {
      name: 'import name',
      description: 'import description',
      smf: { ID_BOARD: 111 }
    };

    before(function() {
      return boards.import(importBoard)
      .then(function(board) {
        importBoard = board;
      });
    });

    it('should verify key mapping for imported boards', function() {
      return boards.boardByOldId(importBoard.smf.ID_BOARD)
      .then(function(board) {
        board.id.should.equal(importBoard.id);
        board.created_at.should.equal(importBoard.created_at);
        board.updated_at.should.be.equal(importBoard.updated_at);
        board.imported_at.should.be.equal(importBoard.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(importBoard.name);
        board.description.should.equal(importBoard.description);
        board.smf.ID_BOARD.should.equal(importBoard.smf.ID_BOARD);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });
  });

  describe('#IMPORT_PURGE', function() {
    var importBoard = {
      name: 'import name',
      description: 'import description',
      smf: { ID_BOARD: 111 }
    };

    before(function() {
      return boards.import(importBoard)
      .then(function(board) {
        importBoard = board;
      });
    });

    it('should purge all imported boards key mappings', function() {
      return boards.purge(importBoard.id)
      .then(function(board) {
        board.id.should.equal(importBoard.id);
        board.created_at.should.be.equal(importBoard.created_at);
        board.updated_at.should.be.equal(importBoard.updated_at);
        board.imported_at.should.be.equal(importBoard.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(importBoard.name);
        board.description.should.equal(importBoard.description);
        board.smf.ID_BOARD.should.equal(importBoard.smf.ID_BOARD);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
        return board.smf.ID_BOARD;
      })
      .then(boards.boardByOldId)
      .catch(function(err) {
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
      });
    });
  });

  describe('#FIND', function() {
    var findBoard = {
      name: 'Find Test Board',
      description: 'Find Test Board Description'
    };

    before(function() {
      return boards.create(findBoard)
      .then(function(board) {
        findBoard = board;
      });
    });

    it('should find specified board', function() {
      return boards.find(findBoard.id)
      .then(function(board){
        board.id.should.equal(findBoard.id);
        board.created_at.should.equal(findBoard.created_at);
        board.updated_at.should.equal(findBoard.updated_at);
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(findBoard.name);
        board.description.should.equal(findBoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.children);
      });
    });
  });

  describe('#FIND-PARENT-CHILDREN', function() {
    var parentBoard = { name: 'Parent Test Board', description: 'desc' };
    var childABoard = { name: 'Child A Board', description: 'description' };
    var childBBoard = { name: 'Child B Board', description: 'description' };

    before(function() {
      return boards.create(parentBoard)
      .then(function(board) {
        parentBoard = board;
        childABoard.parent_id = parentBoard.id;
        childBBoard.parent_id = parentBoard.id;
      })
      .then(function() {
        return boards.create(childABoard)
        .then(function(board) {
          childABoard = board;
        });
      })
      .then(function() {
        return boards.create(childBBoard)
        .then(function(secondBoard) {
          childBBoard = secondBoard;
        });
      });
    });

    it('should find parent board with children attached', function() {
      return boards.find(parentBoard.id)
      .then(function(board) {
        board.id.should.equal(parentBoard.id);
        board.created_at.should.equal(parentBoard.created_at);
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(parentBoard.name);
        board.description.should.equal(parentBoard.description);
        should.not.exist(board.smf);
        board.children.should.be.an('array');
        board.children.should.have.length(2);
      });
    });

    it('should find child board with parent id', function() {
      return boards.find(childABoard.id)
      .then(function(board) {
        board.id.should.equal(childABoard.id);
        board.created_at.should.equal(childABoard.created_at);
        board.updated_at.should.equal(childABoard.updated_at);
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(childABoard.name);
        board.description.should.equal(childABoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.children);
      });
    });
  });

  describe('#CLEANING', function() {
    it('cleaning all db', function() {
      return probe.clean();
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});
