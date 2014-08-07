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

/* IMPORT */
function importPost(post, cb) {
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

  var batch = db.batch();
  batch.put(threadPostKey, {id: postId});
  batch.put(postKey, post);
  batch.write(function(err) {
    if (err) { return cb(err, undefined); }
    else {
      // handle smf post id mapping
      if (post.smf) {
        var smfId = post.smf.post_id.toString();
        var key = postPrefix + sep  + smfId;
        var value = { id: postId };
        smfSubLevel.put(key, value, function(err) {
          if (err) { console.log(err); }
        });
      }

      return cb(null, post);
    }
  });
}

/* CREATE */
function createPost(post, cb) {
  // set created_at datetime
  post.created_at = Date.now();

  var postId = helper.genId(post.created_at);
  post.id = postId;
  var threadId = post.thread_id;
  var threadKey = threadPrefix + sep + threadId;
  var threadPostKey = postIndexPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;

  var afterWrite;
  db.get(threadKey, function(err, thread) {
    // console.log('thread: ' + thread.id + ' with ' + thread.post_count + ' posts');
    afterWrite = function(err, cb) {
      thread.post_count += 1;
      var updateStatsBatch = db.batch();
      updateStatsBatch.put(threadKey, thread);
      // console.log('writing post_count: ' + (thread.post_count));
      updateStatsBatch.write(function(err) {
        return cb(null, post);
      });
    }
    var batch = db.batch();
    batch.put(threadPostKey, {id: postId});
    batch.put(postKey, post);
    batch.write(function(err) {
      if (err) {
        return cb(err, undefined);
      }
      else {
        if (afterWrite) {
          return afterWrite(null, cb);
        }
        else {
          return cb(null, post);
        }
      }
    });
  });
}

/* RETRIEVE POST */
function findPost(postId, cb) {
  var key = postPrefix + sep + postId;
  db.get(key, cb);
}

/* UPDATE */
function updatePost(post, cb) {
  var key = postPrefix + sep + post.id;

  // see if post already exists
  db.get(key, function(err, value, version) {
    if (err) {
      return cb(new Error('Post Not Found'), undefined);
    }
    else {
      // update old post
      value.title = post.title;
      value.body = post.body;

      // input options
      var opts = { version: version };
      
      // update old post
      db.put(key, value, opts, function(err, version) {
        if (err) { return cb(err, undefined); }
        if (version) {
          value.version = version;
          return cb(err, value);
        }
      });
    }
  });
}

/* DELETE */
function deletePost(postId, cb) {
  // delete post with given postId
  var postKey = postPrefix + sep + postId;
  db.get(postKey, function(err, post) {
    if (err) { return cb(new Error('Post Not Found'), undefined); }
    else {
      // delete all associated post indexes
      var associatedKeys = helper.associatedKeys(post);
      async.each(associatedKeys, deleteItr, function(err) {
        if (err) { return cb(err, undefined); }
        else { return cb(err, post); }
      });
    }
  });
}

/* QUERY: post using old id */
function postByOldId(oldId, cb) {
  smfSubLevel.get(postPrefix + sep + oldId, cb);
}

/* QUERY: All the posts in one thread */
function byThread(threadId, opts, cb) {
  var entries = [];
  var handler = function() {
    var postIds = entries.map(function(entry) {
      return entry.value.id;
    });
    async.concat(postIds, findPost, function(err, posts) {
      return cb(null, posts);
    });
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
    start: startPostKey
  };

  // query
  db.createValueStream(queryOptions)
  .on('data', function (entry) {
    entries.push(entry);
  })
  .on('error', cb)
  .on('close', handler)
  .on('end', handler);
}

function deleteItr(opts, callback) {
  if (opts.smf) {
    // delete from smf sublevel
    smfSubLevel.get(opts.key, function(err, board, version) {
      if (err) { return callback (err); }
      else {
        var delOpts = { version: version };
        smfSubLevel.del(opts.key, delOpts, function(err) {
          if (err) { return callback(err); }
          else {
            return callback(); }
        });
      }
    });
  }
  else {
    // delete from db
    db.get(opts.key, function(err, value, version) {
      if (err) { return callback(err); }
      else {
        var delOpts = { version: version };
        db.del(opts.key, delOpts, function(err) {
          if (err) { return callback(err); }
          else {
            // call empty callback to proceed with async each
            return callback();
          }
        });
      }
    });
  }
}

exports = module.exports = {
  import: function(post, cb) {
    validator.importPost(post, cb, importPost);
  },
  create: function(post, cb) {
    validator.createPost(post, cb, createPost);
  },
  find: function(id, cb) {
    validator.id(id, cb, findPost);
  },
  update: function(post, cb) {
    validator.updatePost(post, cb, updatePost);
  },
  delete: function(id, cb) {
    validator.id(id, cb, deletePost);
  },
  postByOldId: function(id, cb) {
    validator.id(id, cb, postByOldId);
  },
  byThread: function(id, opts, cb) {
    validator.byThread(id, opts, cb, byThread);
  }
};

