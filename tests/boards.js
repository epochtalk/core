var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
var dbName = 'test-epoch.db';
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var core = require(path.join(__dirname, '..'))(dbName);
var boards = core.boards;

describe('boards', function() {
  
  describe('#ALL', function() {
    before(function(done) {
      seed.initDb(path.join(__dirname, '..', dbName));
      seed.createBoards(25, done);
    });

    it('should return matching board data', function() {
      return boards.all()
      .then(function(allBoards) {
        for (var i = 0; i < allBoards.length; i++) {
          var boardName = 'Board ' + i;
          var boardDesc = 'Hello World! This is board ' + i + ' in a popular forum.';
          allBoards[i].name.should.equal(boardName);
          allBoards[i].description.should.equal(boardDesc);
        }
      });
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
        board.parent_id.should.equal(parentBoard.id);
        should.not.exist(board.children_ids);
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
          board.parent_id.should.equal(parentBoard.id);
          should.not.exist(board.children_ids);
          should.not.exist(board.children);

          childBBoard = board;
        });
      })
      .then(function() {
        parentBoard.children_ids = [childABoard.id, childBBoard.id];
        return boards.update(parentBoard)
        .then(function(board) {
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
          board.children_ids[0].should.equal(childABoard.id);
          board.children_ids[1].should.equal(childBBoard.id);
          should.not.exist(board.children);
        });
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
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(findBoard.name);
        board.description.should.equal(findBoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
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
      })
      .then(function() {
        parentBoard.children_ids = [childABoard.id, childBBoard.id];
        return boards.update(parentBoard);
      });
    });

    it('should find parent board with children attached', function() {
      return boards.find(parentBoard.id)
      .then(function(board) {
        board.id.should.equal(parentBoard.id);
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
        board.children.should.be.an('array');
        board.children.should.have.length(2);
      });
    });

    it('should find child board with parent id', function() {
      return boards.find(childABoard.id)
      .then(function(board) {
        board.id.should.equal(childABoard.id);
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(childABoard.name);
        board.description.should.equal(childABoard.description);
        should.not.exist(board.smf);
        board.parent_id.should.equal(parentBoard.id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });
  });

  describe('#UPDATE', function() {
    var updateBoard;
    var updateName = 'Update Check 1';
    var updateDesc = 'Update Check 2';

    before(function() {
      var newBoard = {
        name: 'New Board',
        description: 'New Board Description'
      };
      return boards.create(newBoard)
      .then(function(board) {
        updateBoard = board;
      });
    });

    it('should update specified board with new values', function() {
      updateBoard.name = updateName;
      updateBoard.description = updateDesc;

      return boards.update(updateBoard)
      .then(function(board) {
        board.id.should.equal(updateBoard.id)
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(updateName);
        board.description.should.equal(updateDesc);
        should.not.exist(board.smf);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });

    it('should return the updated board on find', function() {
      return boards.find(updateBoard.id)
      .then(function(board) {
        board.id.should.be.ok;
        board.id.should.be.a('string');
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(updateName);
        board.description.should.equal(updateDesc);
        should.not.exist(board.smf);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });
  });

  describe('#IMPORT', function() {
    var importBoard = {
      name: 'import name',
      description: 'import description',
      smf: { board_id: '111' }
    };
    
    it('should import a board', function() {
      return boards.import(importBoard)
      .then(function(board) {
        board.id.should.be.ok;
        board.id.should.be.a('string');
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        board.imported_at.should.be.a('number');
        should.not.exist(board.deleted);
        board.name.should.equal(importBoard.name);
        board.description.should.equal(importBoard.description);
        board.smf.board_id.should.equal(importBoard.smf.board_id);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });
  });

  describe('#IMPORT_GET', function() {
    var importBoard = {
      name: 'import name',
      description: 'import description',
      smf: { board_id: '111' }
    };

    before(function() {
      return boards.import(importBoard)
      .then(function(board) {
        importBoard = board;
      });
    });

    it('should verify key mapping for imported boards', function() {
      return boards.boardByOldId(importBoard.smf.board_id)
      .then(function(board) {
        board.id.should.equal(importBoard.id);
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        board.imported_at.should.be.a('number');
        should.not.exist(board.deleted);
        board.name.should.equal(importBoard.name);
        board.description.should.equal(importBoard.description);
        board.smf.board_id.should.equal(importBoard.smf.board_id);
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
      smf: { board_id: '111' }
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
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        board.imported_at.should.be.a('number');
        should.not.exist(board.deleted);
        board.name.should.equal(importBoard.name);
        board.description.should.equal(importBoard.description);
        board.smf.board_id.should.equal(importBoard.smf.board_id);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
        return board.smf.board_id;
      })
      .then(boards.boardByOldId)
      .catch(function(err) {
        err.should.not.be.null;
      });
    });
  });

  describe('#DELETE', function() {
    var testBoard = {
      name: 'Test Board',
      description: 'Test Board Description'
    };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) {
        testBoard = board;
      });
    });

    it('should delete the specified board', function() {
      return boards.delete(testBoard.id)
      .then(function(board) {
        board.id.should.equal(testBoard.id);
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        board.deleted.should.be.true;
        board.name.should.equal(testBoard.name);
        board.description.should.equal(testBoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);

        return board.id;
      })
      .then(boards.find)
      .then(function(board) {
        board.id.should.equal(testBoard.id);
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        board.deleted.should.be.true;
        board.name.should.equal(testBoard.name);
        board.description.should.equal(testBoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
      });
    });
  });

  describe('#UNDELETE', function() {
    var testBoard = {
      name: 'Test Board',
      description: 'Test Board Description'
    };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { return board.id; })
      .then(boards.delete)
      .then(function(board) { testBoard = board; });
    });

    it('should undelete specified board', function() {
      testBoard.deleted = false;
      return boards.update(testBoard)
      .then(function(board) {
        board.id.should.equal(testBoard.id);
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

  describe('#PURGE', function() {
    var testBoard = {
      name: 'Test Board',
      description: 'Test Board Description'
    };

    before(function() {
      return boards.create(testBoard)
      .then(function(board) { testBoard = board; });
    });

    it('should purge the specified board', function() {
      boards.purge(testBoard.id)
      .then(function(board) {
        board.id.should.equal(testBoard.id);
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
        return board.id;
      })
      .then(boards.find)
      .catch(function(err) {
        err.should.not.be.null;
      });
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });

});
