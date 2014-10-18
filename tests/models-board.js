var rimraf = require('rimraf');
var should = require('chai').should();
var path = require('path');
var dbName = '.testDB';
var probe = require(path.join(__dirname, '..', 'probe'));
var Board = require(path.join(__dirname, '..', 'boards', 'keys'));
var schema = require(path.join(__dirname, '..', 'boards', 'schema'));
var config = require(path.join(__dirname, '..', 'config'));

describe('Board', function() {
  var boardPrefix = config.boards.prefix;
  var sep = config.sep;
  var board = { id: '1234', smf: { ID_BOARD: 4567 } };

  describe('#key', function() {
    it('should return the board\'s key', function() {
      var key = Board.key(board.id);
      var check = boardPrefix + sep + board.id;
      key.should.be.equal(check);
    });
  });

  describe('#postCountKey', function() {
    it('should return the board\'s post count key', function() {
      var key = Board.postCountKey(board.id);
      var check = boardPrefix + sep + board.id + sep + 'post_count';
      key.should.be.equal(check);
    });
  });

  describe('#threadCountKey', function() {
    it('should return the board\'s thread count key', function() {
      var key = Board.threadCountKey(board.id);
      var check = boardPrefix + sep + board.id + sep + 'thread_count';
      key.should.be.equal(check);
    });
  });

  describe('#totalPostCountKey', function() {
    it('should return the board\'s total post count key', function() {
      var key = Board.totalPostCountKey(board.id);
      var check = boardPrefix + sep + board.id + sep + 'total_post_count';
      key.should.be.equal(check);
    });
  });

  describe('#totalThreadCountKey', function() {
    it('should return the board\'s total thread count key', function() {
      var key = Board.totalThreadCountKey(board.id);
      var check = boardPrefix + sep + board.id + sep + 'total_thread_count';
      key.should.be.equal(check);
    });
  });

  describe('#lastPostUsernameKey', function() {
    it('should return the board\'s last post username key', function() {
      var key = Board.lastPostUsernameKey(board.id);
      var check = boardPrefix + sep + board.id + sep + 'last_post_username';
      key.should.be.equal(check);
    });
  });

  describe('#lastPostCreatedAtKey', function() {
    it('should return the board\'s last post created at key', function() {
      var key = Board.lastPostCreatedAtKey(board.id);
      var check = boardPrefix + sep + board.id + sep + 'last_post_created_at';
      key.should.be.equal(check);
    });
  });

  describe('#lastThreadTitleKey', function() {
    it('should return the board\'s last thread title key', function() {
      var key = Board.lastThreadTitleKey(board.id);
      var check = boardPrefix + sep + board.id + sep + 'last_thread_title';
      key.should.be.equal(check);
    });
  });

  describe('#legacyKey', function() {
    it('should return the board\'s legacy key', function() {
      var key = Board.legacyKey(board.smf.ID_BOARD);
      var check = boardPrefix + sep + board.smf.ID_BOARD;
      key.should.be.equal(check);
    });
  });

  describe('#validate', function() {

    it('should validate the minimum board model', function() {
      var minBoard = { name: 'name' };
      var validBoard = schema.validate(minBoard).value();
      validBoard.should.exist;
    });

    it('should validate that name is required', function() {
      var nameBoard = { description: 'hello' };
      return schema.validate(nameBoard)
      .then(function(data) { should.not.exist(data); })
      .catch(function(err) { err.should.exist; });
    });

    it('should validate dates are numbers', function() {
      var dateBoard = {
        name: 'name',
        created_at: 12312312,
        updated_at: 13124121,
        imported_at: 12314124
      };
      var validBoard = schema.validate(dateBoard).value();
      validBoard.should.exi
    });

    it('should validate ids are string', function() {
      var idBoard = {
        name: 'name',
        id: '121314',
        parent_id: '1203234'
      };
      var validBoard = schema.validate(idBoard).value();
      validBoard.should.exist;
    });

    it('should validate children and chlidren_ids are arrays', function() {
      var childBoard = {
        name: 'name',
        children: [{ name: 'child' }],
        children_ids: ['asdasdf']
      };
      var validBoard = schema.validate(childBoard).value();
      validBoard.should.exist;
    });

    it('should validate deleted is a boolean', function() {
      var deleteBoard = {
        name: 'name',
        deleted: true
      };
      var validBoard = schema.validate(deleteBoard).value();
      validBoard.should.exist;
    });

    it('should validate smf id is a number', function() {
      var smfBoard = {
        name: 'name',
        smf: {
          ID_BOARD: 1235
        }
      };
      var validBoard = schema.validate(smfBoard).value();
      validBoard.should.exist;
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
