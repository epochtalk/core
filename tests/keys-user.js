var rimraf = require('rimraf');
var should = require('chai').should();
var path = require('path');
var dbName = '.testDB';
var probe = require(path.join(__dirname, '..', 'probe'));
var User = require(path.join(__dirname, '..', 'users', 'keys'));
var config = require(path.join(__dirname, '..', 'config'));

describe('User', function() {
  var userPrefix = config.users.prefix;
  var indexPrefix = config.users.indexPrefix;
  var sep = config.sep;
  var user = {
    id: '1234',
    username: 'testuser',
    email: 'testuser@email.com'
  };

  describe('#key', function() {
    it('should return the user\'s key', function() {
      var key = User.key(user.id);
      var check = userPrefix + sep + user.id;
      key.should.be.equal(check);
    });
  });

  describe('#legacyKey', function() {
    it('should return a user\'s legacyKey', function() {
      var id = 12345;
      var key = User.legacyKey(id);
      var check = userPrefix + sep + id;
      key.should.be.equal(check);
    });
  });

  describe('#usernameKey', function() {
    it('should return a user\'s legacyKey', function() {
      var key = User.usernameKey(user.username);
      var check = indexPrefix + sep + 'username' + sep + user.username;
      key.should.be.equal(check);
    });
  });

  describe('#emailKey', function() {
    it('should return a user\'s emailKey', function() {
      var key = User.emailKey(user.email);
      var check = indexPrefix + sep + 'email' + sep + user.email;
      key.should.be.equal(check);
    });
  });

  describe('#userViewsKey', function() {
    it('should return a user\'s userViewsKey', function() {
      var key = User.userViewsKey(user.id);
      var check = 'user_views' + sep + user.id;
      key.should.be.equal(check);
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

