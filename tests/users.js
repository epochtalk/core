var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
var dbName = '.testDB';
var core = require(path.join(__dirname, '..'))(dbName);
var users = core.users;
var probe = require(path.join(__dirname, '..', 'probe'));

describe('users', function() {

  describe('#ALL', function() {
    var user1 = {
      username: 'user1',
      email: 'user1@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };
    var user2 = {
      username: 'user2',
      email: 'user2@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(user1)
      .then(function(user) {
        user1 = user;
      })
      .then(function() {
        return users.create(user2)
        .then(function(user) {
          user2 = user;
        });
      });
    });

    it('should return all users', function() {
      return users.all()
      .then(function(allUsers) {
        allUsers.forEach(function(user) {
          user.id.should.be.ok;
          user.id.should.be.a('string');
          user.created_at.should.be.a('number');
          user.updated_at.should.be.a('number');
          should.not.exist(user.imported_at);
          user.username.should.be.ok;
          user.username.should.be.a('string');
          user.email.should.be.ok;
          user.email.should.be.a('string');
          should.not.exist(user.password);
          should.not.exist(user.confirmation);
          user.passhash.should.be.ok;
          user.passhash.should.be.a('string');
          should.not.exist(user.deleted);
          should.not.exist(user.smf);
        });
      });
    });

    it('should return 2 users', function() {
      return users.all()
      .then(function(allUsers) {
        allUsers.should.have.length(2);
      });
    });
  });

  describe('#CREATE', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    it('should create and return the created user', function() {
      return users.create(testUser)
      .then(function(user) {
        user.id.should.be.ok;
        user.id.should.be.a('string');
        user.created_at.should.be.a('number');
        user.updated_at.should.be.a('number');
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.be.ok;
        user.passhash.should.be.a('string');
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
      });
    });
  });

  describe('#IMPORT', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234',
      smf: {
        ID_MEMBER: '123'
      }
    };

    it('should import and return the imported user', function() {
      return users.import(testUser)
      .then(function(user) {
        user.id.should.be.ok;
        user.id.should.be.a('string');
        user.created_at.should.be.a('number');
        user.updated_at.should.be.a('number');
        user.imported_at.should.be.a('number');
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.be.ok;
        user.passhash.should.be.a('string');
        should.not.exist(user.deleted);
        user.smf.ID_MEMBER.should.equal(testUser.smf.ID_MEMBER);
      });
    });
  });

  describe('#IMPORT_GET', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234',
      smf: {
        ID_MEMBER: '123'
      }
    };

    before(function() {
      return users.import(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should verify key mapping for imported users', function() {
      return users.userByOldId(testUser.smf.ID_MEMBER)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.equal(testUser.updated_at);
        user.imported_at.should.equal(testUser.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        user.smf.ID_MEMBER.should.equal(testUser.smf.ID_MEMBER);
      });
    });
  });

  describe('#IMPORT_PURGE', function() {
    var catchCalled = false;
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234',
      smf: {
        ID_MEMBER: '123'
      }
    };

    before(function() {
      return users.import(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should delete all imported thread key mappings', function() {
      return users.purge(testUser.id)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.equal(testUser.updated_at);
        user.imported_at.should.equal(testUser.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        user.smf.ID_MEMBER.should.equal(testUser.smf.ID_MEMBER);
        return user.smf.ID_MEMBER;
      })
      .then(users.userByOldId)
      .catch(function(err) {
        catchCalled = true;
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
      })
      .then(function() {
        catchCalled.should.be.true;
      });
    });
  });

  describe('#FIND', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should find a user from the db', function() {
      return users.find(testUser.id)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.equal(testUser.updated_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
      });
    });
  });

  describe('#FIND_BY_USERNAME', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should find a user from the db by username', function() {
      return users.userByUsername(testUser.username)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.equal(testUser.updated_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
      });
    });
  });

  describe('#FIND_BY_EMAIL', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should find a user from the db by email', function() {
      return users.userByEmail(testUser.email)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.equal(testUser.updated_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
      });
    });
  });

  describe('#UPDATE', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should update specified user with new values', function() {
      testUser.email = 'anotherUser@randomdomain1234.org';
      testUser.password = '1234asdf';
      testUser.confirmation = '1234asdf';

      return users.update(testUser)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.be.above(testUser.created_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.be.ok;
        user.passhash.should.be.a('string');
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
        testUser.passhash = user.passhash;
      });
    });

    it('should return the updated user on find', function() {
      return users.find(testUser.id)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.be.above(testUser.created_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
      });
    });
  });

  describe('#DELETE', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should deactive a user from the db', function() {
      return users.delete(testUser.id)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.be.above(testUser.created_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        user.deleted.should.be.true;
        should.not.exist(user.smf);
        return user.id;
      })
      .then(users.find)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.be.above(testUser.created_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        user.deleted.should.be.true;
        should.not.exist(user.smf);
      });
    });
  });

  describe('#UNDELETE', function() {
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(testUser)
      .then(function(user) {
        testUser = user;
      })
      .then(function() {
        return users.delete(testUser.id);
      })
      .then(function(user) {
        testUser = user;
      });
    });

    it('should undelete specified user', function() {
      testUser.deleted = false;
      return users.update(testUser)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.be.above(testUser.created_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
        return user.id;
      })
      .then(users.find)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.be.above(testUser.created_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
      });
    });
  });

  describe('#PURGE', function() {
    var catchCalled = false;
    var testUser = {
      username: 'testuser',
      email: 'testuser@randomdomain1234.org',
      password: 'asdf1234',
      confirmation: 'asdf1234'
    };

    before(function() {
      return users.create(testUser)
      .then(function(user) {
        testUser = user;
      });
    });

    it('should purge the specified user', function() {
      return users.purge(testUser.id)
      .then(function(user) {
        user.id.should.equal(testUser.id);
        user.created_at.should.equal(testUser.created_at);
        user.updated_at.should.equal(testUser.updated_at);
        should.not.exist(user.imported_at);
        user.username.should.equal(testUser.username);
        user.email.should.equal(testUser.email);
        should.not.exist(user.password);
        should.not.exist(user.confirmation);
        user.passhash.should.equal(testUser.passhash);
        should.not.exist(user.deleted);
        should.not.exist(user.smf);
        return user.id;
      })
      .then(users.find)
      .catch(function(err) {
        catchCalled = true;
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
      })
      .then(function() {
        catchCalled.should.be.true;
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

