var users = {};
module.exports = users;

var path = require('path');
var bcrypt = require('bcrypt');
var Promise = require('bluebird');
var config = require(path.join(__dirname, '..', 'config'));
var db = require(path.join(__dirname, '..', 'db'));
var tree = db.tree;
var helper = require(path.join(__dirname, '..', 'helper'));
var User = require(path.join(__dirname, 'keys'));
var Padlock = require('padlock').Padlock;
var userViewsLock = new Padlock();

users.import = function(user) {
  user.imported_at = Date.now();
  return users.create(user)
  .then(function(dbUser) {
    if (dbUser.smf) {
      return db.legacy.putAsync(User.legacyKey(dbUser.smf.ID_MEMBER), dbUser.id)
      .then(function() {
        return dbUser;
      });
    }
  });
};

users.create = function(user) {
  return new Promise(function(fulfill, reject) {
    var timestamp = Date.now();
    if (!user.created_at) {
      user.created_at = timestamp;
      user.updated_at = timestamp;
    }
    else if (!user.updated_at) {
      user.updated_at = user.created_at;
    }
    // prepare for storage or match
    if (user.password) {
      user.passhash = bcrypt.hashSync(user.password, 12);
    }

    delete user.password;
    var newUser = {
      object: user,
      type: 'user',
      callback: function(options) {
        var storedUser = options.value;
        if (options.err) {
          reject(options.err);
        }
        else {
          storedUser.id = options.key[1];
          fulfill(storedUser);
        }
      }
    };
    tree.store(newUser);
  });
};

users.find = function(id) {
  return new Promise(function(fulfill, reject) {
    tree.get(['user', id], function(err, results) {
      var storedUser = results.value;
      if (err) { reject(err); }
      else {
        storedUser.id = id;
        fulfill(storedUser);
      }
    });
  });
};

users.userByOldId = function(legacyId) {
  var legacyUserKey = User.legacyKey(legacyId);
  return db.legacy.getAsync(legacyUserKey)
  .then(users.find);
};

users.userByUsername = function(username) {
  return new Promise(function(fulfill, reject) {
    var options = {
      type: 'user',
      indexedField: 'username',
      indexedValue: username.toLowerCase(),
      limit: 1
    };
    tree.nodes(options)
    .on('data', function(data) {
      fulfill(data);
    })
    .on('error', function(err) {
      reject(err);
    });
  });
};

users.userByEmail = function(email) {
  return new Promise(function(fulfill, reject) {
    var options = {
      type: 'user',
      indexedField: 'email',
      indexedValue: email.toLowerCase(),
      limit: 1
    };
    tree.nodes(options)
    .on('data', function(data) {
      fulfill(data);
    })
    .on('error', function(err) {
      reject(err);
    });
  });
};

users.update = function(user) {
  var userKey = User.key(user.id);
  var updateUser;
  return db.content.getAsync(userKey)
  .then(function(userData) { // handle username change
    var oldUsername = userData.username;
    var newUsername = user.username;
    if (newUsername && oldUsername !== newUsername) {
      // remove old username index
      var oldUsernameKey = User.usernameKey(oldUsername);
      return db.indexes.delAsync(oldUsernameKey)
      // insert new username index
      .then(function() {
        var lowerCaseUsername = newUsername.toLowerCase();
        var newUsernameKey = User.usernameKey(lowerCaseUsername);
        return db.indexes.putAsync(newUsernameKey, user.id);
      })
      .then(function() { return userData; });
    }
    else { return userData; }
  })
  .then(function(userData) { // handle email change
    var oldEmail = userData.email;
    var newEmail = user.email;

    if (newEmail && oldEmail !== newEmail) {
      // remove old email index
      var oldEmailKey = User.emailKey(oldEmail);
      return db.indexes.delAsync(oldEmailKey)
      // insert new email index
      .then(function() {
        var lowerCaseEmail = newEmail.toLowerCase();
        var newEmailKey = User.emailKey(lowerCaseEmail);
        return db.indexes.putAsync(newEmailKey, user.id);
      })
      .then(function() { return userData; });
    }
    else { return userData; }
  })
  .then(function(userData) { // update user data
    updateUser = userData;

    if (user.username) { updateUser.username = user.username; }
    if (user.email) { updateUser.email = user.email; }
    // prepare for storage or match
    if (user.password) {
      updateUser.passhash = bcrypt.hashSync(user.password, 12);
    }
    if (user.name) { updateUser.name = user.name; }
    if (user.website) { updateUser.website = user.website; }
    if (user.btcAddress) { updateUser.btcAddress = user.btcAddress; }
    if (user.gender) { updateUser.gender = user.gender; }
    if (user.dob) { updateUser.dob = user.dob; }
    if (user.location) { updateUser.location = user.location; }
    if (user.language) { updateUser.language = user.language; }
    if (user.signature) { updateUser.signature = user.signature; }
    if (user.avatar) { updateUser.avatar = user.avatar; }
    if (user.reset_token) { updateUser.reset_token = user.reset_token; }
    if (user.reset_expiration) { updateUser.reset_expiration = user.reset_expiration; }
    if (user.confirmation_token === undefined) { delete updateUser.confirmation_token; }
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
  var userKey = User.key(id);
  var deletedUser;

  return db.content.getAsync(userKey)
  .then(function(userData) {
    deletedUser = userData;

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

users.undelete = function(id) {
  var userKey = User.key(id);
  var deletedUser;

  return db.content.getAsync(userKey)
  .then(function(userData) {
    deletedUser = userData;

    // remove deleted flag
    delete deletedUser.deleted;
    deletedUser.updated_at = Date.now();

    // insert back into db
    return db.content.putAsync(userKey, deletedUser);
  })
  .then(function() {
    return deletedUser;
  });
};

users.purge = function(id) {
  var userKey = User.key(id);
  var purgeUser;

  return db.content.getAsync(userKey)
  .then(function(userData) {
    purgeUser = userData;
    return db.deleted.putAsync(userKey, userData);
  })
  .then(function() {
    return db.content.delAsync(userKey);
  })
  .then(function() { // delete usernameKey
    var usernameKey = User.usernameKey(purgeUser.username);
    return db.indexes.delAsync(usernameKey);
  })
  .then(function() { // delete emailKey
    var emailKey = User.emailKey(purgeUser.email);
    return db.indexes.delAsync(emailKey);
  })
  .then(function() { // delete legacykey
    if (purgeUser.smf) {
      var legacyKey = User.legacyKey(purgeUser.smf.ID_MEMBER);
      return db.legacy.delAsync(legacyKey);
    }
    else { return; }
  })
  .then(function() {
    return purgeUser;
  });
};

users.all = function() {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    var sorter = function(entry) {
      entries.push(entry.value);
    };
    var handler = function() {
      return fulfill(entries);
    };

    var modelPrefix = config.users.prefix;
    var query = { gte: modelPrefix, lte: modelPrefix + '\xff'};
    db.content.createReadStream(query)
    .on('data', sorter)
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
};

users.getUserViews = function(id) {
  // build userView key
  var userViewsKey = User.userViewsKey(id);
  return db.metadata.getAsync(userViewsKey);
};

users.putUserViews = function(userId, userViewsArray) {
  return new Promise(function(fulfill, reject) {
    userViewsLock.runwithlock(function() {
      var userViewsKey = User.userViewsKey(userId);
      db.metadata.getAsync(userViewsKey)
      .catch(function(err) { // userViews don't exists yet
        return {};
      })
      .then(function(userViews) {
        // TODO: handle both array form and single object form
        // add each userView
        userViewsArray.forEach(function(view) {
          userViews[view.threadId] = view.timestamp;
        });
        return userViews;
      })
      .then(function(userViews) {
        return db.metadata.putAsync(userViewsKey, userViews);
      })
      .then(function() {
        fulfill();
        userViewsLock.release();
      })
      .catch(function(err) {
        reject(err);
        userViewsLock.release();
      });
    });
  });
};
