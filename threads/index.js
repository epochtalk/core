var async = require('async');
var path = require('path');
var sublevel = require('level-sublevel');
var db = require(path.join(__dirname, '..', 'db'));
var threadLevel = sublevel(db);
var smfSubLevel = threadLevel.sublevel('meta-smf');
var config = require(path.join(__dirname, '..', 'config'));
var sep = config.sep;
var postPrefix = config.posts.prefix;
var postIndexPrefix = config.posts.indexPrefix;
var threadPrefix = config.threads.prefix;
var threadIndexPrefix = config.threads.indexPrefix;
var helper = require(path.join(__dirname, '..', 'helper'));
var validator = require(path.join(__dirname, 'validator'));
var posts = require(path.join(__dirname, '..', 'posts'));

/* IMPORT: 
  Creates
  - a index from board id to thread id
  - a thread value
  - smf mapping from old id to new thread id
  Then calls posts.import. Preserves board_id as a flag to tell
  which post is thread starting post.
*/
function importThread(thread, cb) {
  // set created_at and imported_at datetime
  var ts = Date.now();
  if(!thread.created_at) { thread.created_at = ts; }
  else { thread.created_at = Date.parse(thread.created_at) || thread.created_ad; }
  thread.imported_at = ts;

  // batch
  var batch = db.batch();
  
  // add board - thread index
  var boardId = thread.board_id;
  var threadId = helper.genId(thread.created_at);
  var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
  var threadIndexValue = {
    id: threadId,
    created_at: thread.created_at
  };


  batch.put(boardThreadKey, threadIndexValue);
  
  // add thread object
  var threadValue = {
    id: threadId,
    created_at: thread.created_at,
    imported_at: thread.imported_at,
    post_count: 1,
    smf: thread.smf
  };

  var threadKey = threadPrefix + sep + threadId;
  batch.put(threadKey, threadValue);

  // write out
  batch.write(function(err) {
    if (err) { return cb(err, undefined); }
    else {
      // handle smf thread id mapping
      if (thread.smf) {
        var smfId = thread.smf.thread_id.toString();
        var key = threadPrefix + sep  + smfId;
        var value = { id: threadId };
        smfSubLevel.put(key, value, function(err) {
          if (err) { console.log(err); }
        });
      }

      // configuring post
      thread.thread_id = threadId;
      delete thread.created_at;
      delete thread.imported_at;
      posts.import(thread, cb);
    }
  });
}

/* CREATE:
  Creates thread from first post
  - a index from board id to thread id
  - a first post value
  Then calls posts.import
*/
function createThread(firstPost, cb) {
  // set created_at datetime
  firstPost.created_at = Date.now();

  // batch
  var batch = db.batch();

  // add board - thread index
  var boardId = firstPost.board_id;
  var threadId = helper.genId(firstPost.created_at);
  var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
  var threadIndexObject = {
    id: threadId,
    created_at: firstPost.created_at
  };

  batch.put(boardThreadKey, threadIndexObject);

  // add thread object
  var threadObject = {
    id: threadId,
    created_at: firstPost.created_at,
    imported_at: firstPost.imported_at,
    post_count: 0,
    smf: firstPost.smf
  };

  var threadKey = threadPrefix + sep + threadId;
  batch.put(threadKey, threadObject);

  batch.write(function(err) {
    if (err) { return cb(err, undefined); }
    else {
      // configuring post
      firstPost.thread_id = threadId;
      delete firstPost.created_at;
      posts.create(firstPost, cb);
    }
  });
}

/* RETRIEVE THREAD */
function findThread(threadId, cb) {
  var key = threadPrefix + sep + threadId;
  db.get(key, cb);
}

/* UPDATE */
function updateThread(thread, cb) {
  // see if thread already exists
  var key = threadPrefix + sep + thread.id;
  db.get(key, function(err, value, version) {
    if (err) {
      return cb(new Error('Thread Not Found'), undefined);
    }
    else {
      // update old thread
      value.post_count = thread.post_count;

      // input options
      var opts = { version: version };
      
      // update old post
      db.put(key, value, opts, function(err, version) {
        value.version = version;
        return cb(err, value);
      });
    }
  });
}

/* DELETE */
function deleteThread(threadId, cb) {
  // delete thread with given threadId
  var threadKey = threadPrefix + sep + threadId;
  db.get(threadKey, function(err, thread) {
    if (err) { return cb(new Error('Post Not Found'), undefined); }
    else {
      // delete all associated thread indexes
      var associatedKeys = helper.associatedKeys(thread);
      async.each(associatedKeys, deleteItr, function(err) {
        if (err) { return cb(err, undefined); }
        else { return cb(err, thread); }
      });
    }
  });
}

/* QUERY: thread using old id */
function threadByOldId(oldId, cb) {
  smfSubLevel.get(threadPrefix + sep + oldId, cb);
}

/* QUERY: All the threads in one board */
function threads(boardId, opts, cb) {
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
            entryObject.created_at = entry.value.created_at;
            return callback(null, entryObject);
          }
        });
      },
      function(err, threads) {
        if (err) { return cb(err, undefined); }
        if (threads) { return cb(null, threads); }
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
  .on('data', function (entry) { entries.push(entry); })
  .on('error', cb)
  .on('close', handler)
  .on('end', handler);
}

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

exports = module.exports = {
  import: function(thread, cb) {
    validator.importThread(thread, cb, importThread);
  },
  create: function(thread, cb) {
    validator.createThread(thread, cb, createThread);
  },
  find: function(id, cb) {
    validator.id(id, cb, findThread);
  },
  update: function(thread, cb) {
    validator.updateThread(thread, cb, updateThread);
  },
  delete: function(id, cb) {
    validator.id(id, cb, deleteThread);
  },
  threadByOldId: function(id, cb) {
    validator.id(id, cb, threadByOldId);
  },
  threads: function(id, opts, cb) {
    validator.threads(id, opts, cb, threads);
  }
};
