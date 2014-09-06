var users = {};
module.exports = users;

var path = require('path');
var bcrypt = require('bcrypt');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var helper = require(path.join(__dirname, '..', 'helper'));
var User = require(path.join(__dirname, 'model'));

users.import = function(user) {
  user.imported_at = Date.now();
  return users.insert(user)
  .then(function(dbUser) {
    if (dbUser.smf) {
      return db.legacy.putAsync(dbUser.legacyKey(), dbUser.id)
      .then(function() {
        return dbUser;
      });
    }
  });
};

users.insert = function(user) {
  var timestamp = Date.now();
  if (!user.created_at) {
    user.created_at = timestamp;
    user.updated_at = timestamp;
  }
  else if (!user.updated_at) {
    user.updated_at = user.created_at;
  }
  user.id = helper.genId(user.created_at);
  // prepare for storage or match
  if (user.password) {
    user.passhash = bcrypt.hashSync(user.password, 12);
  }

  delete user.password;
  delete user.confirmation;

  return db.content.putAsync(user.key(), user)
  .then(function() {
    return user;
  });
};

users.find = function(id) {
  var userKey = User.keyFromId(id);
  return db.content.getAsync(userKey);
};

users.findByLegacyId = function(legacyId) {
  var legacyUserKey = User.legacyKeyFromId(legacyId);

  return db.legacy.getAsync(legacyUserKey)
  .then(users.find);
};

users.update = function(user) {
  var userKey = user.key();
  var updateUser;

  return db.content.getAsync(userKey)
  .then(function(userData) {
    updateUser = new User(userData);

    if (user.username) { updateUser.username = user.username; }
    if (user.email) { updateUser.email = user.email; }
    // prepare for storage or match
    if (user.password) {
      updateUser.passhash = bcrypt.hashSync(user.password, 12);
    }
    if (user.deleted) { updateUser.deleted = user.deleted; }
    else { delete updateUser.deleted; }
    updateUser.updated_at = Date.now();

    delete updateUser.password;
    delete updateUser.confirmation;

    // insert back into db
    return db.content.putAsync(userKey, updateUser);
  })
  .then(function() {
    return updateUser;
  });
};

users.delete = function(id) {
  var userKey = User.keyFromId(id);
  var deletedUser;

  return db.content.getAsync(userKey)
  .then(function(userData) {
    deletedUser = new User(userData);

    // add deleted: true flag to board
    deletedUser.deleted = true;
    deletedUser.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(userKey, deletedUser);
  })
  .then(function() {
    return deletedUser;
  });
};

users.purge = function(id) {
  var userKey = User.keyFromId(id);
  var purgeUser;

  return db.content.getAsync(userKey)
  .then(function(userData) {
    purgeUser = new User(userData);
    return db.deleted.putAsync(userKey, userData);
  })
  .then(function() {
    return db.content.delAsync(userKey);
  })
  .then(function() {
    if (purgeUser.smf) {
      var legacyKey = purgeUser.legacyKey();
      return db.legacy.delAsync(legacyKey);
    }
    else { return; }
  })
  .then(function() {
    return purgeUser;
  });
};
