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

var Promise = require('bluebird');
db = Promise.promisifyAll(db);
smfSubLevel = Promise.promisifyAll(smfSubLevel);

/* IMPORT: 
  Creates
  - a index from board id to thread id
  - a thread value
  - smf mapping from old id to new thread id
  Then calls posts.import. Preserves board_id as a flag to tell
  which post is thread starting post.
*/
function importThread(thread) {
  // set created_at and imported_at datetime
  var ts = Date.now();
  if(!thread.created_at) { thread.created_at = ts; }
  else { thread.created_at = Date.parse(thread.created_at) || thread.created_ad; }
  thread.imported_at = ts;

  // board - thread index key and value
  var boardId = thread.board_id;
  var threadId = helper.genId(thread.created_at);
  var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
  var threadIndexValue = {
    id: threadId,
    created_at: thread.created_at
  };
  
  // thread model object key and value
  var threadKey = threadPrefix + sep + threadId;
  var threadValue = {
    id: threadId,
    created_at: thread.created_at,
    imported_at: thread.imported_at,
    post_count: 1,
    smf: thread.smf
  };

  var batchArray = [
    { type: 'put', key: boardThreadKey, value: threadIndexValue },
    { type: 'put', key: threadKey, value: threadValue }
  ];

  return db.batchAsync(batchArray)
  .then(function(value) {
    // handle smf thread id mapping
    if (thread.smf) {
      var smfId = thread.smf.thread_id.toString();
      var key = threadPrefix + sep  + smfId;
      var smfValue = { id: threadId };
      return smfSubLevel.putAsync(key, smfValue)
      .then(function(value) {
        thread.thread_id = threadId;
        delete thread.created_at;
        delete thread.imported_at;
        return posts.import(thread);
      });
    }
    else {
      // configuring post
      thread.thread_id = threadId;
      delete thread.created_at;
      delete thread.imported_at;
      return posts.import(thread);
    }
  });
}

/* CREATE:
  Creates thread from first post
  - a index from board id to thread id
  - a first post value
  Then calls posts.import
*/
function createThread(firstPost) {
  // set created_at datetime
  firstPost.created_at = Date.now();

  // board - thread index key and value
  var boardId = firstPost.board_id;
  var threadId = helper.genId(firstPost.created_at);
  var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
  var threadIndexObject = {
    id: threadId,
    created_at: firstPost.created_at
  };

  // thread object key and value
  var threadKey = threadPrefix + sep + threadId;
  var threadObject = {
    id: threadId,
    created_at: firstPost.created_at,
    imported_at: firstPost.imported_at,
    post_count: 0,
    smf: firstPost.smf
  };

  // db batch 
  var batchArray = [
    { type: 'put', key: boardThreadKey, value: threadIndexObject },
    { type: 'put', key: threadKey, value: threadObject }
  ];
  return db.batchAsync(batchArray)
  .then(function() {
    firstPost.thread_id = threadId; // append threadId
    delete firstPost.created_at;    // remove created_at
    return posts.create(firstPost); // call create post
  });
}

/* RETRIEVE THREAD */
function findThread(threadId) {
  var key = threadPrefix + sep + threadId;
  return db.getAsync(key)
  .then(function(value) {
    // [0] thread, [1] version
    return value[0];
  });
}

/* UPDATE */
function updateThread(thread) {
  // see if thread already exists
  var key = threadPrefix + sep + thread.id;

  return db.getAsync(key)
  .then(function(value) {
    // [0] thread, [1] version
    var oldThread = value[0];
    var version = value[1];

    // update old thread
    oldThread.post_count = thread.post_count;

    // input options
    var opts = { version: version };
    
    // update old post
    return db.putAsync(key, oldThread, opts)
    .then(function(newVersion) {
      oldThread.version = newVersion;
      return oldThread;
    });
  });
}

/* DELETE */
function deleteThread(threadId) {
  // delete thread with given threadId
  var threadKey = threadPrefix + sep + threadId;
  return db.getAsync(threadKey)
  .then(function(value) {
    // [0] thread, [1] version
    var thread = value[0];
    var version = value[1];

    // collect all associated thread indexes
    var associatedKeys = helper.associatedKeys(thread);

    // delete each key and return post
    return Promise.all(associatedKeys.map(deleteItr))
    .then(function(value) { return thread; });
  });
}

/* QUERY: thread using old id */
function threadByOldId(oldId) {
  var key = threadPrefix + sep + oldId;
  return smfSubLevel.getAsync(key)
  .then(function(value) {
    return value.id;
  });
}

/* QUERY: All the threads in one board */
function threads(boardId, opts) {
  return new Promise(function(fulfill, reject) {
    var entries = [];
    // return map of entries as an threadId and title
    var handler = function() {
      async.map(entries,
        function(entry, callback) {
          var threadId = entry.value.id;
          var entryObject = { id: threadId };
          // get title of first post of each thread
          threadFirstPost(threadId)
          .then(function(post) {
            entryObject.title = post.title;
            entryObject.created_at = entry.value.created_at;
            return callback(null, entryObject);
          })
          .catch(function(err) {
            return callback(err, undefined);
          });
        },
        function(err, threads) {
          if (err) { return reject(err); }
          if (threads) { return fulfill(threads); }
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
    .on('error', reject)
    .on('close', handler)
    .on('end', handler);
  });
}

function threadFirstPost(threadId) {
  return new Promise(function(fulfill, reject) {
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
    .on('error', reject)
    .on('close', function() {
      posts.find(postId)
      .then(function(post){
        return fulfill(post);
      });
    })
    .on('end', function() {
      posts.find(postId)
      .then(function(post) {
        return fulfill(post);
      });
    });
  });
}

function deleteItr(opts) {
  if (opts.smf) {
    // delete from smf sublevel
    return smfSubLevel.getAsync(opts.key)
    .then(function(value) {
      return smfSubLevel.delAsync(opts.key);
    });
  }
  else {
    // delete from db
    return db.getAsync(opts.key)
    .then(function(value) {
      // [0] value, [1] version
      var version = value[1];
      var delOpts = { version: version };
      return delOpts;
    })
    .then(function(delOpts) {
      return db.delAsync(opts.key, delOpts);
    });
  }
}

exports = module.exports = {
  import: function(thread) {
    return validator.importThread(thread, importThread);
  },
  create: function(thread) {
    return validator.createThread(thread, createThread);
  },
  find: function(id) {
    return validator.id(id, findThread);
  },
  update: function(thread) {
    return validator.updateThread(thread, updateThread);
  },
  delete: function(id) {
    return validator.id(id, deleteThread);
  },
  threadByOldId: function(id) {
    return validator.id(id, threadByOldId);
  },
  threads: function(id, opts) {
    return validator.threads(id, opts, threads);
  }
};
