var rimraf = require('rimraf');
var should = require('chai').should();
var dbName = 'test-epoch.db';
var path = require('path');
var core = require(path.join(__dirname, '..'))(dbName);
var users = core.users;
var User = require(path.join(__dirname, '..', 'users', 'model'));
var config = require(path.join(__dirname, '..', 'config'));

describe('User', function() {

  describe('#new', function() {
    var savedUser;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return core.users.create(newUser)
      .then(function(dbUser) {
        savedUser = dbUser;
      });
    });
    it('should create a new User object', function() {
      var user = new User(savedUser);
      user.should.be.a('object');
      should.not.exist(user.password);
      should.not.exist(user.confirmation);
      should.not.exist(user.smf);
      should.not.exist(user.imported_at);
      should.not.exist(user.deleted);
      //TODO: Should passhash be in the usermodel?
      user.username.should.equal(newUser.username);
      user.email.should.equal(newUser.email);
    });
  });

  describe('#key', function() {
    var savedUser;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return core.users.create(newUser)
      .then(function(dbUser) {
        savedUser = dbUser;
      });
    });
    it('should return a user object\'s key', function() {
      var userPrefix = config.users.prefix;
      var sep = config.sep;

      var user = new User(savedUser);
      var key = user.key();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(userPrefix + sep + user.id);
    });
  });

  describe('#legacyKey', function() {
    var savedUser;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk',
      smf: {
        ID_MEMBER: 12345
      }
    };
    before(function() {
      return core.users.import(newUser)
      .then(function(dbUser) {
        savedUser = dbUser;
      });
    });
    it('should return a user object\'s legacyKey', function() {
      var userPrefix = config.users.prefix;
      var sep = config.sep;

      var user = new User(savedUser);
      var key = user.legacyKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(userPrefix + sep + user.smf.ID_MEMBER);
    });
  });

  describe('#legacyKeyForId', function() {
    it('should return a user object\'s legacyKey', function() {
      var userPrefix = config.users.prefix;
      var sep = config.sep;
      var id = 12345;
      var key = User.legacyKeyForId(id);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(userPrefix + sep + id);
    });
  });

  describe('#validateCreate', function() {
    it('should validate the minimum user model', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      var validUser = user.validateCreate().value();
      validUser.should.exist;
    });

    it('should validate the username is string', function() {
      var minUser = {
        username: 123,
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username must be a string');
      })
    });

    it('should validate the username min length is 2', function() {
      var minUser = {
        username: 'a',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username length must be at least 2 characters long');
      })
    });

    it('should validate the username max length is 30', function() {
      var minUser = {
        username: '1231254123kjskzjhdakjwdakhbhjqwbiukjbedakhbdkhawbd',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username length must be less than or equal to 30 characters long');
      })
    });

    it('should validate that username is required', function() {
      var testUser = {};
      var user = new User(testUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username is required');
      })
    });

    it('should validate that email is required', function() {
      var testUser = { username: 'test_user' };
      var user = new User(testUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email is required');
      })
    });

    it('should validate the email is a string', function() {
      var minUser = {
        username: 'test_user',
        email: 1231241254,
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a string');
      })
    });

    it('should validate the email is valid', function() {
      var minUser = {
        username: 'test_user',
        email: '1231241234',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a valid email');
      })
    });

    it('should validate that password is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com' };
      var user = new User(testUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password is required');
      })
    });

    it('should validate the password is a string', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 123456,
        confirmation: 123456
      };
      var user = new User(minUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password must be a string');
      })
    });

    it('should validate that password confirmation is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com', password: 'abc123' };
      var user = new User(testUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password missing required peer confirmation');
      })
    });

    it('should validate the password matches confirmation', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: '123456',
        confirmation: '1234567'
      };
      var user = new User(minUser);
      return user.validateCreate()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('confirmation must be one of ref:password');
      })
    });
  });

  describe('#validateImport', function() {
    it('should validate the minimum user model', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk',
        smf: {
          ID_MEMBER: '12345'
        }
      };
      var user = new User(minUser);
      var validUser = user.validateImport().value();
      validUser.should.exist;
    });

    it('should validate that the ID_MEMBER is a number', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk',
        smf: {
          ID_MEMBER: '12345'
        }
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('ID_MEMBER must be a number');
      })
    });

    it('should validate the username is string', function() {
      var minUser = {
        username: 123,
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username must be a string');
      })
    });

    it('should validate the username min length is 2', function() {
      var minUser = {
        username: 'a',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username length must be at least 2 characters long');
      })
    });

    it('should validate the username max length is 30', function() {
      var minUser = {
        username: '1231254123kjskzjhdakjwdakhbhjqwbiukjbedakhbdkhawbd',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username length must be less than or equal to 30 characters long');
      })
    });

    it('should validate that username is required', function() {
      var testUser = {};
      var user = new User(testUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username is required');
      })
    });

    it('should validate that email is required', function() {
      var testUser = { username: 'test_user' };
      var user = new User(testUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email is required');
      })
    });

    it('should validate the email is a string', function() {
      var minUser = {
        username: 'test_user',
        email: 1231241254,
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a string');
      })
    });

    it('should validate the email is valid', function() {
      var minUser = {
        username: 'test_user',
        email: '1231241234',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a valid email');
      })
    });

    it('should validate that password is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com' };
      var user = new User(testUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password is required');
      })
    });

    it('should validate the password is a string', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 123456,
        confirmation: 123456
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password must be a string');
      })
    });

    it('should validate that password confirmation is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com', password: 'abc123' };
      var user = new User(testUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password missing required peer confirmation');
      })
    });

    it('should validate the password matches confirmation', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: '123456',
        confirmation: '1234567'
      };
      var user = new User(minUser);
      return user.validateImport()
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('confirmation must be one of ref:password');
      })
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

