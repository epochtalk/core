var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
var Promise = require('bluebird');
var dbName = '.testDB';
var core = require(path.join(__dirname, '..'))(dbName);
var probe = require(path.join(__dirname, '..', 'probe'));
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var boards = core.boards;

describe('boards', function() {

  describe('#ALL', function() {
    before(function(done) {
      seed(25, 0, 0, done);
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
          should.not.exist(board.parent_id);
          board.children_ids.should.be.an('array');
          board.children_ids.should.have.length(2);
          board.children_ids[0].should.equal(childABoard.id);
          board.children_ids[1].should.equal(childBBoard.id);
          board.children.should.be.an('array');
          board.children.should.have.length(2);
          board.children[0].id.should.equal(childABoard.id);
          board.children[1].id.should.equal(childBBoard.id);
        });
      });
    });
  });

  describe('#IMPORT', function() {
    var importBoard = {
      name: 'import name',
      description: 'import description',
      smf: { ID_BOARD: '111' }
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
        parentBoard.children_ids.should.be.an('array');
        parentBoard.children_ids.should.have.length(1);
        parentBoard.children_ids[0].should.equal(importChildBoard.id);
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
        board.created_at.should.equal(childABoard.created_at);
        board.updated_at.should.equal(childABoard.updated_at);
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
        board.created_at.should.equal(updateBoard.created_at);
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
        board.id.should.equal(updateBoard.id);
        board.created_at.should.equal(updateBoard.created_at);
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

  describe('#UPDATE_CATEGORIES', function() {
    var categories = [{
      name: 'General Discussion',
      board_ids: []
    },
    {
      name: 'Offtopic Discussion',
      board_ids: []
    },
    {
      name: 'Movies Discussion',
      board_ids: []
    },
    {
      name: 'Music Discussion',
      board_ids: []
    }];
    var allBoardIds = [];
    var lastBoardId;
    var childBoard = {
      name: 'Test Child Board',
      description: 'Test Child Board Description'
    };

    before(function() {

      var boardsToCreate = [];
      for (var i = 0; i < 16; i++) {
        var newBoard = {
          name: 'New Board ' + (i + 1),
          description: 'New Board Description ' + (i + 1)
        };

        boardsToCreate.push(newBoard);
      }
      return Promise.each(boardsToCreate, function(board) {
        return boards.create(board)
        .then(function(board) {
          lastBoardId = board.id;
          return allBoardIds.push(board.id);
        });
      })
      .then(function() {
        childBoard.parent_id = lastBoardId;
        return boards.create(childBoard);
      })
      .then(function(createdBoard) {
        childBoard = createdBoard;
        categories[0].board_ids.push(allBoardIds[0]);
        categories[0].board_ids.push(allBoardIds[1]);
        categories[0].board_ids.push(allBoardIds[2]);
        categories[0].board_ids.push(allBoardIds[3]);
        categories[1].board_ids.push(allBoardIds[4]);
        categories[1].board_ids.push(allBoardIds[5]);
        categories[1].board_ids.push(allBoardIds[6]);
        categories[1].board_ids.push(allBoardIds[7]);
        categories[2].board_ids.push(allBoardIds[8]);
        categories[2].board_ids.push(allBoardIds[9]);
        categories[2].board_ids.push(allBoardIds[10]);
        categories[2].board_ids.push(allBoardIds[11]);
        categories[3].board_ids.push(allBoardIds[12]);
        categories[3].board_ids.push(allBoardIds[13]);
        categories[3].board_ids.push(allBoardIds[14]);
        categories[3].board_ids.push(allBoardIds[15]);
        return categories;
      });
    });

    it('should update the board categories and board\'s category_id', function() {
      return boards.updateCategories(categories)
      .then(function(cats) {
        cats.should.be.equal(categories);
        cats[0].name.should.be.equal('General Discussion');
        cats[0].board_ids.length.should.be.equal(4);

        cats[1].name.should.be.equal('Offtopic Discussion');
        cats[1].board_ids.length.should.be.equal(4);

        cats[2].name.should.be.equal('Movies Discussion');
        cats[2].board_ids.length.should.be.equal(4);

        cats[3].name.should.be.equal('Music Discussion');
        cats[3].board_ids.length.should.be.equal(4);

        Promise.each(cats, function(category) {
          var i = 0;
          Promise.each(category.board_ids, function(boardId) {
            return boards.find(boardId)
            .then(function(board) {
              cats[board.category_id - 1].board_ids[i++].should.be.equal(boardId);
            });
          });
        });
      });
    });

    it('should return of all boards in their respective categories', function() {
      return boards.allCategories()
      .then(function(allCats) {
        allCats.length.should.be.equal(4);

        allCats[0].board_ids[0].should.be.equal(allBoardIds[0]);
        allCats[0].board_ids[0].should.be.equal(allCats[0].boards[0].id);
        allCats[0].board_ids[1].should.be.equal(allBoardIds[1]);
        allCats[0].board_ids[1].should.be.equal(allCats[0].boards[1].id);
        allCats[0].board_ids[2].should.be.equal(allBoardIds[2]);
        allCats[0].board_ids[2].should.be.equal(allCats[0].boards[2].id);
        allCats[0].board_ids[3].should.be.equal(allBoardIds[3]);
        allCats[0].board_ids[3].should.be.equal(allCats[0].boards[3].id);

        allCats[1].board_ids[0].should.be.equal(allBoardIds[4]);
        allCats[1].board_ids[0].should.be.equal(allCats[1].boards[0].id);
        allCats[1].board_ids[1].should.be.equal(allBoardIds[5]);
        allCats[1].board_ids[1].should.be.equal(allCats[1].boards[1].id);
        allCats[1].board_ids[2].should.be.equal(allBoardIds[6]);
        allCats[1].board_ids[2].should.be.equal(allCats[1].boards[2].id);
        allCats[1].board_ids[3].should.be.equal(allBoardIds[7]);
        allCats[1].board_ids[3].should.be.equal(allCats[1].boards[3].id);

        allCats[2].board_ids[0].should.be.equal(allBoardIds[8]);
        allCats[2].board_ids[0].should.be.equal(allCats[2].boards[0].id);
        allCats[2].board_ids[1].should.be.equal(allBoardIds[9]);
        allCats[2].board_ids[1].should.be.equal(allCats[2].boards[1].id);
        allCats[2].board_ids[2].should.be.equal(allBoardIds[10]);
        allCats[2].board_ids[2].should.be.equal(allCats[2].boards[2].id);
        allCats[2].board_ids[3].should.be.equal(allBoardIds[11]);
        allCats[2].board_ids[3].should.be.equal(allCats[2].boards[3].id);

        allCats[3].board_ids[0].should.be.equal(allBoardIds[12]);
        allCats[3].board_ids[0].should.be.equal(allCats[3].boards[0].id);
        allCats[3].board_ids[1].should.be.equal(allBoardIds[13]);
        allCats[3].board_ids[1].should.be.equal(allCats[3].boards[1].id);
        allCats[3].board_ids[2].should.be.equal(allBoardIds[14]);
        allCats[3].board_ids[2].should.be.equal(allCats[3].boards[2].id);
        allCats[3].board_ids[3].should.be.equal(allBoardIds[15]);
        allCats[3].board_ids[3].should.be.equal(allCats[3].boards[3].id);

        // Ensure allCategories brings back child boards.
        allCats[3].boards[3].children_ids.length.should.be.equal(1);
        allCats[3].boards[3].children_ids[0].should.be.equal(childBoard.id);
        allCats[3].boards[3].children.length.should.be.equal(1);
        allCats[3].boards[3].children[0].id.should.be.equal(childBoard.id);
      });

      // TODO: one more test with all cats flipped
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
        board.created_at.should.be.equal(testBoard.created_at);
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
        board.created_at.should.be.equal(testBoard.created_at);
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
      return boards.undelete(testBoard.id)
      .then(function(board) {
        board.id.should.equal(testBoard.id);
        board.created_at.should.equal(testBoard.created_at);
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
      .then(function(board) {
        board.id.should.equal(testBoard.id);
        board.created_at.should.equal(testBoard.created_at);
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
    var parentBoard = { name: 'Parent Board', description: 'Parent Description' };
    var testBoard = {
      name: 'Test Board',
      description: 'Test Board Description'
    };
    var categories;
    before(function() {
      return boards.allCategories()
      .then(function(cats) {
        return Promise.each(cats, function(cat) {
          delete cat.boards;
          return cat;
        })
        .then(function() {
          categories = cats;
          return boards.create(parentBoard);
        });
      })
      .then(function(board) {
        parentBoard = board;
        categories[0].board_ids.push(board.id);
        testBoard.parent_id = board.id;
        return boards.create(testBoard);
      })
      .then(function(board) {
        testBoard = board;
        return boards.updateCategories(categories);
      });
    });

    it('should purge the specified board', function() {
      return boards.find(parentBoard.id)
      .then(function(board) { // Check parent to make sure child exists
        board.children_ids.should.be.an('array');
        board.children_ids.should.have.length(1);
        board.children_ids[0].should.equal(testBoard.id);
        board.children.should.be.an('array');
        board.children.should.have.length(1);
        board.children[0].id.should.equal(testBoard.id);
        board.category_id.should.equal(1); // category_id should be 1
        return boards.purge(testBoard.id)
      })
      .then(function(board) {
        board.id.should.equal(testBoard.id);
        board.created_at.should.equal(testBoard.created_at);
        board.updated_at.should.equal(testBoard.updated_at);
        board.parent_id.should.equal(parentBoard.id);
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(testBoard.name);
        board.description.should.equal(testBoard.description);
        should.not.exist(board.smf);
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
        should.not.exist(board.category_id);
        return boards.find(board.id);
      })
      .catch(function(err) {
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
        return boards.find(parentBoard.id);
      })
      .then(function(board) { // verify purged child was removed.
        should.not.exist(board.children_ids);
        should.not.exist(board.children);
        return boards.purge(parentBoard.id);
      })
      .then(function(deletedParent) {
        should.not.exist(deletedParent.category_id);
        return boards.allCategories();
      })
      .then(function(cats) { // Ensure Purged boards are removed from their categories
        cats[0].board_ids.length.should.be.equal(4);
        cats[0].board_ids[0].should.not.be.equal(parentBoard.id);
        cats[0].board_ids[1].should.not.be.equal(parentBoard.id);
        cats[0].board_ids[2].should.not.be.equal(parentBoard.id);
        cats[0].board_ids[3].should.not.be.equal(parentBoard.id);
      });
    });
  });

  describe('#SANITIZE', function() {
    var safeTitle = 'Test Board';
    var unsafeTitle = '<b>Test</b> Board<script>alert("something");</script>';
    var safeDescription = '<div>Test</div> Board <b>Description</b>';
    var unsafeDescription = '<div class="test">Test</div> Board <b>Description</b><script>alert("something");</script><IMG SRC="javascript:alert("XSS");">';
    var testBoard = {
      name: unsafeTitle,
      description: unsafeDescription
    };

    it('should sanitize on create/update/import board', function() {
      return boards.create(testBoard)
      .then(function(board) {
        board.id.should.be.ok;
        board.id.should.be.a('string');
        board.created_at.should.be.a('number');
        board.updated_at.should.be.a('number');
        should.not.exist(board.imported_at);
        should.not.exist(board.deleted);
        board.name.should.equal(safeTitle);
        board.description.should.equal(safeDescription);
        should.not.exist(board.smf);
        should.not.exist(board.parent_id);
        should.not.exist(board.children_ids);
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
