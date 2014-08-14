var assert = require('assert');
var path = require('path');
var rimraf = require('rimraf');
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);
var users = core.users;
var seed = require(path.join(__dirname, '..', 'seed', 'seed'));
var emptyCb = function() {};

seed.initDb('test-epoch.db');

describe('users', function() {
  describe('#CREATE', function() {
    it('should create and return the created user', function(done) {
      var testUser = {
        username: 'testuser',
        email: 'testuser@randomdomain1234.org',
        password: 'asdf1234',
        confirmation: 'asdf1234',
      };
      users.create(testUser)
      .then(function(user) {
        assert.equal(user.name, testUser.name);
        assert.equal(user.description, testUser.description);
        savedUser = user;
        done();
      })
      .catch(function(err) {
        console.log(err);
        done(err);
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

