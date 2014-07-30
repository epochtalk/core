var async = require('async');
var db = require(__dirname + '/db');
var sublevel = require('level-sublevel');
var config = require(__dirname + '/config');
var helper = require(__dirname + '/helper');
var postLevel = sublevel(db);
var smfSubLevel = postLevel.sublevel('meta-smf');
var sep = config.sep;
var postPrefix = config.posts.prefix;
var postIndexPrefix = config.posts.indexPrefix;
var threadPrefix = config.threads.prefix;
var threadIndexPrefix = config.threads.indexPrefix;

// helper
var printPost = helper.printPost;

var posts = {};

posts.import = function(post, cb) {
  if (!post) { return cb(new Error('No Post Found'), undefined); }
  if (cb === undefined) { cb = printPost; }
  if (!post.thread_id && !post.board_id) {
    var errorMessage = 'BOARD_ID REQUIRED IF NO THREAD_ID';
    return cb(new Error(errorMessage), undefined);
  }
  if (!post.smf.post_id) {
    var errorPostMessage = 'SMF POST_ID DOES NOT EXISTS';
    return cb(new Error(errorPostMessage), undefined);
  }
  if (!post.thread_id && !post.smf.thread_id) {
    var errorThreadMessage = 'SMF THREAD_ID DOES NOT EXISTS';
    return cb(new Error(errorThreadMessage), undefined);
  }

  // check if created_at exists and set post id
  var ts = Date.now(); // current time
  var postId = '';
  if (post.created_at) {
    // set imported_at datetime
    post.imported_at = ts;
    // generate post id from old timestamp
    postId = helper.genId(post.created_at);
  }
  else {
    // user current time as created_at and imported_at
    post.created_at = ts;
    post.imported_at = ts;
    // generate post id from current time
    postId = helper.genId(ts);
  }

  var threadId = post.thread_id;
  var boardId = post.board_id;
  var batch = db.batch();

  // smf metadata
  var smf = post.smf;

  // new thread
  if (!threadId && boardId) {
    // separate id for thread, generated with created_at
    threadId = helper.genId(post.created_at);
    var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
    batch.put(boardThreadKey, {id: threadId});

    // handle smf thread id mapping
    if (smf) {
      var key = threadPrefix + sep  + smf.thread_id.toString();
      var value = { id: threadId };
      smfSubLevel.put(key, value, function(err) {
        if (err) { console.log(err); }
      });
    }
  }

  // configuring post
  post.thread_id = threadId;
  post.id = postId;

  var threadPostKey = postIndexPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;
  batch.put(threadPostKey, {id: postId});
  batch.put(postKey, post);
  batch.write(function(err) {
    // handle smf post id mapping
    if (smf) {
      var key = postPrefix + sep  + smf.post_id.toString();
      var value = { id: postId };
      smfSubLevel.put(key, value, function(err) {
        return cb(err, post);
      });
    }
    else {
      return cb(err, post);
    }
  });
};

/* CREATE */
posts.create = function(post, cb) {
  if (cb === undefined) { cb = printPost; }
  var ts = Date.now();
  var postId = helper.genId(ts);
  var threadId = post.thread_id;
  var boardId = post.board_id;

  var batch = db.batch();

  // new thread
  if (!threadId) {
    // separate id for thread
    threadId = helper.genId(ts);
    var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
    batch.put(boardThreadKey, {id: threadId});
  }

  // configuring post
  post.thread_id = threadId;
  post.id = postId;
  post.created_at = ts;

  var threadPostKey = postIndexPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;
  batch.put(threadPostKey, {id: postId});
  batch.put(postKey, post);
  batch.write(function(err) {
    return cb(err, post);
  });
};

/* RETRIEVE POST */
posts.find = function(postId, cb) {
  if (cb === undefined) { cb = printPost; }
  var key = postPrefix + sep + postId;
  db.get(key, cb);
};

/* UPDATE */
posts.update = function(post, cb) {
  if (cb === undefined) { cb = printPost; }
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
        value.version = version;
        return cb(err, value);
      });
    }
  });
};

/* DELETE */
posts.delete = function(postId, cb) {
  if (cb === undefined) { cb = printPost; }

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
};

/* QUERY: post using old id */
posts.postByOldId = function(oldId, cb) {
  if (cb === undefined) { cb = null; }
  smfSubLevel.get(postPrefix + sep + oldId, cb);
};

/* QUERY: thread using old id */
posts.threadByOldId = function(oldId, cb) {
  if (cb === undefined) { cb = null; }
  smfSubLevel.get(threadPrefix + sep + oldId, cb);
};

/* QUERY: All the threads in one board */
posts.threads = function(boardId, opts, cb) {
  if (cb === undefined) { cb = printPost; }
  var entries = [];
  // return map of entries as an threadId and title
  var handler = function() {
    async.map(entries,
      function(entry, callback) {
        var threadId = entry.value.id;
        var entryObject = { id: threadId };
        // get title of first post of each thread
        threadFirstPost(threadId, function(err, post) {
          if (err) { return callback(err, undefined); }
          if (post) {
            entryObject.title = post.title;
            return callback(null, entryObject);
          }
        });
      },
      function(err, threads) {
        if (err) {
          return cb(err, undefined);
        }
        return cb(null, threads);
      }
    );
  };

  // query vars
  var endIndexKey = threadIndexPrefix + sep + boardId + sep;
  var startThreadKey = endIndexKey;
  var limit = opts.limit ? Number(opts.limit) : 10;
  if (opts.startThreadId) {
    endIndexKey += opts.startThreadId + '\x00';
  }
  else {
    endIndexKey += '\xff';
  }
  var queryOptions = {
    limit: limit,
    reverse: true,
    start: startThreadKey + '\x00',
    end: endIndexKey
  };

  // query thread Index
  db.createReadStream(queryOptions)
  .on('data', function (entry) {
    entries.push(entry);
  })
  .on('error', cb)
  .on('close', handler)
  .on('end', handler);
};

/* QUERY: All the posts in one thread */
posts.byThread = function(threadId, opts, cb) {
  var entries = [];
  var handler = function() {
    var postIds = entries.map(function(entry) {
      return entry.value.id;
    });
    async.concat(postIds, posts.find, function(err, posts) {
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
};

function threadFirstPost(threadId, cb) {
  // returned post
  var postId = '';

  // build the postIndexKey
  var postIndexKey = postIndexPrefix + sep + threadId;

  // get the first post from the postIndex by threadId
  var postIndexOpts = {
    limit: 1,
    start: postIndexKey + sep,
    end: postIndexKey + sep + '\xff'
  };

  // search the postIndex
  db.createReadStream(postIndexOpts)
  .on('data', function(postIndex) {
    postId = postIndex.value.id;
  })
  .on('error', function(err) {
    return cb(err, undefined);
  })
  .on('close', function() {
    posts.find(postId, function(err, post) {
      return cb(null, post);
    });
  })
  .on('end', function() {
    posts.find(postId, function(err, post) {
      return cb(null, post);
    });
  });
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

module.exports = posts;

