var rimraf = require('rimraf');
var should = require('chai').should();
var path = require('path');
var probe = require(path.join(__dirname, '..', 'probe'));
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);
var users = core.users;
var User = require(path.join(__dirname, '..', 'users', 'model'));
var config = require(path.join(__dirname, '..', 'config'));

describe('User', function() {

  describe('#new', function() {
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        newUser = dbUser;
      });
    });

    it('should create a new User object', function() {
      var user = new User(newUser);
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

  describe('#key', function() {
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };

    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        newUser = dbUser;
      });
    });
    
    it('should return a user\'s key', function() {
      var userPrefix = config.users.prefix;
      var sep = config.sep;

      var user = new User(newUser);
      var key = user.key();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(userPrefix + sep + user.id);
    });
  });

  describe('#keyFromId', function() {
    it('should return the user\'s key', function() {
      var userPrefix = config.users.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = User.keyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(userPrefix + sep + fakeId);
    });
  });

  describe('#legacyKey', function() {
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
      return users.import(newUser)
      .then(function(dbUser) {
        newUser = dbUser;
      });
    });
    
    it('should return a user\'s legacyKey', function() {
      var userPrefix = config.users.prefix;
      var sep = config.sep;

      var user = new User(newUser);
      var key = user.legacyKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(userPrefix + sep + user.smf.ID_MEMBER);
    });
  });

  describe('#legacyKeyFromId', function() {
    it('should return a user\'s legacyKey', function() {
      var userPrefix = config.users.prefix;
      var sep = config.sep;
      var id = 12345;
      var key = User.legacyKeyFromId(id);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(userPrefix + sep + id);
    });
  });

  describe('#usernameKey', function() {
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };

    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        newUser = dbUser;
      });
    });
    
    it('should return a user\'s usernameKey', function() {
      var indexPrefix = config.users.indexPrefix;
      var sep = config.sep;
      var username = newUser.username;

      var user = new User(newUser);
      var key = user.usernameKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(indexPrefix + sep + 'username' + sep + username);
    });
  });

  describe('#usernameKeyFromInput', function() {
    it('should return a user\'s legacyKey', function() {
      var indexPrefix = config.users.indexPrefix;
      var sep = config.sep;
      var username = 'username';
      var key = User.usernameKeyFromInput(username);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(indexPrefix + sep + 'username' + sep + username);
    });
  });

  describe('#emailKey', function() {
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };

    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        newUser = dbUser;
      });
    });
    
    it('should return a user\'s emailKey', function() {
      var indexPrefix = config.users.indexPrefix;
      var sep = config.sep;
      var email = newUser.email;

      var user = new User(newUser);
      var key = user.emailKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(indexPrefix + sep + 'email' + sep + email);
    });
  });

  describe('#emailKeyFromInput', function() {
    it('should return a user\'s emailKey', function() {
      var indexPrefix = config.users.indexPrefix;
      var sep = config.sep;
      var email = 'email';
      var key = User.emailKeyFromInput(email);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(indexPrefix + sep + 'email' + sep + email);
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username must be a string');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username length must be at least 2 characters long');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username length must be less than or equal to 30 characters long');
      });
    });

    it('should validate that username is required', function() {
      var testUser = {};
      var user = new User(testUser);
      return user.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username is required');
      });
    });

    it('should validate that email is required', function() {
      var testUser = { username: 'test_user' };
      var user = new User(testUser);
      return user.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email is required');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a string');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a valid email');
      });
    });

    it('should validate that password is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com' };
      var user = new User(testUser);
      return user.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password is required');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password must be a string');
      });
    });

    it('should validate that password confirmation is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com', password: 'abc123' };
      var user = new User(testUser);
      return user.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password missing required peer confirmation');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('confirmation must be one of ref:password');
      });
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
          ID_MEMBER: '123s45'
        }
      };
      var user = new User(minUser);
      return user.validateImport()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('ID_MEMBER must be a number');
      });
    });

    // ID_MEMBER should be required

    it('should validate the username is string', function() {
      var minUser = {
        username: 123,
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateImport()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username must be a string');
      });
    });

    it('should validate that username is required', function() {
      var testUser = {};
      var user = new User(testUser);
      return user.validateImport()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username is required');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a string');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password must be a string');
      });
    });

    it('should validate that password confirmation is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com', password: 'abc123' };
      var user = new User(testUser);
      return user.validateImport()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password missing required peer confirmation');
      });
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
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('confirmation must be one of ref:password');
      });
    });
  });

  describe('#validateUpdate', function() {
    it('should validate the minimum user model', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      var validUser = user.validateUpdate().value();
      validUser.should.exist;
    });

    it('should validate the id is a string', function() {
      var minUser = {
        id: 124,
        username: 'test_user',
        email: 1231241254,
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.message.should.equal('id must be a string');
      });
    });

    it('should validate the created_at is a number', function() {
      var minUser = {
        created_at: '123542345s2345',
        username: 'name',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('created_at must be a number');
      });
    });

    it('should validate the updated_at is a number', function() {
      var minUser = {
        updated_at: '123542345s2345',
        username: 'name',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('updated_at must be a number');
      });
    });

    it('should validate the imported_at is a number', function() {
      var minUser = {
        imported_at: '123542345s2345',
        username: 'name',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('imported_at must be a number');
      });
    });

    it('should validate the deleted is a boolean', function() {
      var minUser = {
        deleted: '123542345s2345',
        username: 'name',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('deleted must be a boolean');
      });
    });

    it('should validate the username is string', function() {
      var minUser = {
        username: 123,
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('username must be a string');
      });
    });

    it('should validate the email is a string', function() {
      var minUser = {
        username: 'test_user',
        email: 1231241254,
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('email must be a string');
      });
    });

    it('should validate the password is a string', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 123456,
        confirmation: 123456
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password must be a string');
      });
    });

    it('should validate that password confirmation is required', function() {
      var testUser = { username: 'test_user', email: 'test_user@example.com', password: 'abc123' };
      var user = new User(testUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('password missing required peer confirmation');
      });
    });

    it('should validate the password matches confirmation', function() {
      var minUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: '123456',
        confirmation: '1234567'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('confirmation must be one of ref:password');
      });
    });

    it('should validate the passhash is a string', function() {
      var minUser = {
        passhash: 234234,
        username: 'name',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      var user = new User(minUser);
      return user.validateUpdate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('passhash must be a string');
      });
    });
  });

  describe('#simple', function() {
    var fullUser = {
      created_at: 212424525,
      updated_at: 342523422,
      imported_at: 2323424234,
      id: 'asdflkalskdfa',
      username: 'laskdsdfa',
      email: 'hello@mate.com',
      password: 'laksdjflask',
      confirmation: 'laksdjflask',
      passhash: 'aslkdfjaslkdjfklasjflkjasldkjflkasjdfasf',
      deleted: true,
      smf: {
        ID_MEMBER: 234235
      }
    };

    it('should return a simple version of the user', function() {
      var user = new User(fullUser);
      var simpleUser = user.simple();
      simpleUser.id.should.equal(fullUser.id);
      simpleUser.created_at.should.equal(fullUser.created_at);
      simpleUser.updated_at.should.equal(fullUser.updated_at);
      simpleUser.imported_at.should.equal(fullUser.imported_at);
      simpleUser.username.should.equal(fullUser.username);
      simpleUser.email.should.equal(fullUser.email);
      simpleUser.password.should.equal(fullUser.password);
      simpleUser.confirmation.should.equal(fullUser.confirmation);
      simpleUser.passhash.should.equal(fullUser.passhash);
      simpleUser.deleted.should.be.true;
      simpleUser.smf.ID_MEMBER.should.equal(fullUser.smf.ID_MEMBER);

      should.not.exist(simpleUser.key);
      should.not.exist(simpleUser.legacyKey);
      should.not.exist(simpleUser.validateCreate);
      should.not.exist(simpleUser.validateImport);
      should.not.exist(simpleUser.validateUpdate);
      should.not.exist(simpleUser.simple);
      should.not.exist(simpleUser.keyFromId);
      should.not.exist(simpleUser.legacyKeyFromId);
      should.not.exist(simpleUser.prefix);
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

