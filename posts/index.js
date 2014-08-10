var async = require('async');
var path = require('path');
var sublevel = require('level-sublevel');
var db = require(path.join(__dirname, '..', 'db'));
var postLevel = sublevel(db);
var smfSubLevel = postLevel.sublevel('meta-smf');
var config = require(path.join(__dirname, '..', 'config'));
var sep = config.sep;
var postPrefix = config.posts.prefix;
var postIndexPrefix = config.posts.indexPrefix;
var threadPrefix = config.threads.prefix;
var helper = require(path.join(__dirname, '..', 'helper'));
var validator = require(path.join(__dirname, 'validator'));

var Promise = require('bluebird');
db = Promise.promisifyAll(db);
smfSubLevel = Promise.promisifyAll(smfSubLevel);

/* IMPORT */
function importPost(post) {
  // set created_at and imported_at datetime
  var ts = Date.now();
  if(!post.created_at) { post.created_at = ts; }
  else { post.created_at = Date.parse(post.created_at) || post.created_ad; }
  post.imported_at = ts;
  
  var postId = helper.genId(post.created_at);
  post.id = postId;
  var threadId = post.thread_id;
  var threadPostKey = postIndexPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;

  var batchArray = [
    { type: 'put', key: threadPostKey, value: {id: postId} },
    { type: 'put', key: postKey, value: post }
  ];
  
  return db.batchAsync(batchArray)
  .then(function(value) {
    // handle smf post id mapping
    if (post.smf) {
      var smfId = post.smf.post_id.toString();
      var key = postPrefix + sep  + smfId;
      var smfValue = { id: postId };
      return smfSubLevel.putAsync(key, smfValue)
      .then(function(value) {
        return post;
      });
    }
    else { return post; }
  });
}

/* CREATE */
function createPost(post) {
  // set created_at datetime
  post.created_at = Date.now();
  var postId = helper.genId(post.created_at);
  post.id = postId;
  var threadId = post.thread_id;
  var threadKey = threadPrefix + sep + threadId;
  var threadPostKey = postIndexPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;

  var afterWrite;

  return db.getAsync(threadKey)
  .then(function(value) {
    // [0] thread, [1] version
    var thread = value[0];
    var version = value[1];

    if (thread.deleted) {
      throw new Error('Key has been deleted: ' + threadKey);
    }

    afterWrite = function() {
      return new Promise(function(fulfill, reject) {
        var startKey = postIndexPrefix + sep + threadId + sep;
        var endKey = startKey + '\xff';
        var postCount = 0;

        var handler = function() {
          thread.post_count = postCount;
          var batchArray = [
            {type: 'put', key: threadKey, value: thread, version: version }
          ];
          return db.batchAsync(batchArray)
          .then(function() {
            fulfill(post);
          });
        };

        db.createReadStream({start: startKey, end: endKey}) //TODO: No version for indexes, so no versionLimi?
        .on('data', function () { postCount += 1; }) //TODO: What do we do if its deleted?
        .on('error', reject)
        .on('close', handler)
        .on('end', handler);
      });
    };

    var batchArray = [
      { type: 'put', key: threadPostKey, value: {id: postId} },
      { type: 'put', key: postKey, value: post }
    ];
    return db.batchAsync(batchArray)
    .then(function() {
      if (afterWrite) {
        return afterWrite();
      }
      else {
        return post;
      }
    });
  });
}

/* RETRIEVE POST */
function findPost(postId) {
  var key = postPrefix + sep + postId;
  return db.getAsync(key)
  .then(function(value) {
    // [0] post, [1] version
    var post = value[0];
    if (post.deleted) {
      throw new Error('Key has been deleted: ' + key);
    }
    return value[0];
  });
}

/* UPDATE */
function updatePost(post) {
  var key = postPrefix + sep + post.id;

  // see if post already exists
  return db.getAsync(key)
  .then(function(value) {
    var oldPost = value[0];
    if (oldPost.deleted) {
      throw new Error('Key has been deleted: ' + key);
    }
    // update old post
    oldPost.title = post.title;
    oldPost.body = post.body;

    // input options
    return [key, oldPost];
  })
  .spread(function(key, oldPost) {
    return db.putAsync(key, oldPost)
    .then(function(version) {
      return [oldPost, version];
    });
  })
  .spread(function(post, version) {
    post.version = version;
    return post;
  });
}

/* DELETE */
function deletePost(postId) {
  // delete post with given postId
  var postKey = postPrefix + sep + postId;
  return db.getAsync(postKey)
  .then(function(value) {
    // [0] post, [1] version
    var post = value[0];
    if (post.deleted) {
      throw new Error('Key has been deleted: ' + postKey);
    }
    post.version = value[1];
    // collect all associated post indexes
    var associatedKeys = helper.associatedKeys(post);

    // delete each key and return post
    return Promise.all(associatedKeys.map(deleteItr))
    .then(function() { return post; });
  });
}

/* QUERY: post using old id */
function postByOldId(oldId) {
  var key = postPrefix + sep + oldId;
  return smfSubLevel.getAsync(key)
  .then(function(value) {
    if (value.deleted) {
      throw new Error('Key has been deleted: ' + key);
    }
    return value.id;
  });
}

/* QUERY: All the posts in one thread */
function byThread(threadId, opts) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    var handler = function() {
      // get post id from each entry
      var postIds = entries.map(function(entry) {
        return entry.value.id;
      });

      // get post for each postId
      async.concat(postIds,
        function(postId, callback) {
          findPost(postId)
          .then(function(post) {
            callback(null, post);
          });
        },
        // return all posts
        function(err, posts) { return fulfill(posts); });
    };

    // query vars
    var limit = opts.limit ? Number(opts.limit) : 10;
    var startPostKey = postIndexPrefix + sep + threadId + sep;
    var endIndexKey = startPostKey;
    if (opts.startPostId) {
      endIndexKey += opts.startPostId;
      startPostKey += '\xff';
    }
    else {
      endIndexKey += '\xff';
    }
    var queryOptions = {
      limit: limit,
      end: endIndexKey,
      start: startPostKey,
      versionLimit: 1
    };

    // query for all posts fir this threadId
    db.createValueStream(queryOptions)
    .on('data', function (entry) { if (!entry.value.deleted) { entries.push(entry); } })
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
}

function deleteItr(opts) {
  if (opts.smf) {
    // delete from smf sublevel
    return smfSubLevel.getAsync(opts.key)
    .then(function(value) {
      var obj = value;
      obj.deleted = true;
      return [opts.key, obj];
    })
    .spread(function(key, obj) {
      return smfSubLevel.putAsync(key, obj);
    });
  }
  else {
    // delete from db
    return db.getAsync(opts.key)
    .then(function(value) {
      // [0] value, [1] version
      var obj = value[0];
      obj.deleted = true;
      return [opts.key, obj, { version: value[1] }];
    })
    .spread(function(key, obj, versionObj) {
      return db.putAsync(key, obj, versionObj);
    });
  }
}

exports = module.exports = {
  import: function(post) {
    return validator.importPost(post, importPost);
  },
  create: function(post) {
    return validator.createPost(post, createPost);
  },
  find: function(id) {
    return validator.id(id, findPost);
  },
  update: function(post) {
    return validator.updatePost(post, updatePost);
  },
  delete: function(id) {
    return validator.id(id, deletePost);
  },
  postByOldId: function(id) {
    return validator.id(id, postByOldId);
  },
  byThread: function(id, opts) {
    return validator.byThread(id, opts, byThread);
  }
};
