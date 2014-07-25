var uuid = require('node-uuid');
var async = require('async');
var db = require(__dirname + '/db');
var config = require(__dirname + '/config');
var helper = require(__dirname + '/helper');
var sep = config.sep;
var postPrefix = config.posts.prefix;
var threadPrefix = config.threads.prefix;

// helper
var makeHandler = helper.makeHandler;
var printPost = helper.printPost;

var posts = {};

/* CREATE */
posts.create = function(post, cb) {
  if (cb === undefined) cb = printPost;
  var ts = Date.now();
  var postId = helper.genId(ts);
  var threadId = post.thread_id;
  var boardId = post.board_id;

  var batch = db.batch();

  // new thread
  if (!threadId) {
    // separate id for thread
    threadId = helper.genId(ts);
    var boardThreadKey = threadPrefix + sep + boardId + sep + threadId;
    batch.put(boardThreadKey, {id: threadId});
  }

  // configuring post
  post.thread_id = threadId;
  post.id = postId;
  post.created_at = ts;

  var threadPostKey = postPrefix + sep + threadId + sep + postId;
  var postKey = postPrefix + sep + postId;
  batch.put(threadPostKey, {id: postId});
  batch.put(postKey, post);
  batch.write(function(err) {
    return cb(err, post);
  });
};

/* RETRIEVE POST */
posts.find = function(postId, cb) {
  if (cb === undefined) cb = printPost;
  var key = postPrefix + sep + postId;
  db.get(key, cb);
};

/* UPDATE */
posts.update = function(post, cb) {
  if (cb === undefined) cb = printPost;
  var key = postPrefix + sep + post.thread_id + sep + post.id;

  // see if post already exists
  db.get(key, function(err, oldPost, version) {
    if (err) {
      return cb(new Error('Post Not Found'), undefined);
    }
    else {
      // update old post
      var oldThreadId = oldPost.thread_id;
      var oldBoardId = oldPost.board_id;
      oldPost.title = post.title;
      oldPost.body = post.body;

      // input options
      var opts = { version: version };
      
      // update old post
      db.put(key, oldPost, opts, function(err, version) {
        oldPost.version = version;
        return cb(err, oldPost);
      });
    }
  });
};

/* DELETE */
posts.delete = function(threadId, postId, cb) {
  if (cb === undefined) cb = printPost;

  var key = postPrefix + sep + threadId + sep + postId;

  // see if post already exists
  db.get(key, function(err, post, version) {
    if (err) {
      return cb(new Error('Post Not Found'), undefined);
    }
    else {
      var opts = { version: version };
      db.del(key, opts, function(err, version) {
        return cb(null, post);
      });
    }
  });
};

/* RETRIEVE THREAD */
posts.thread = function(boardId, id, cb) {
  if (cb === undefined) cb = printPost;
  var key = threadPrefix + sep + boardId + sep + id;
  db.get(key, cb);
};

/* QUERY: All the threads in one board */
posts.threads = function(boardId, limit, cb) {
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
          console.log(err);
          return cb(err, undefined);
        }
        return cb(null, threads);
      }
    );
  };

  // query vars
  var searchKey = threadPrefix + sep + boardId;
  var queryOptions = {
    limit: Number(limit + 1),
    reverse: true,
    start: searchKey,
    end: searchKey + '\xff'
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
  var limit = opts.limit ? opts.limit : 10;
  var startThreadKey = postPrefix + sep + threadId + sep;
  var startPostKey = startThreadKey;
  if (opts.startPostId) startPostKey += opts.startPostId;
  var queryOptions = {
    limit: (limit + 1),
    start: startPostKey,
    end: startThreadKey + '\xff'
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

/* QUERY: All posts in all threads but no threads */
posts.all = function(cb) {
  var entries = [];
  var handler = makeHandler(entries, cb);

  // query
  db.createReadStream({ start: postPrefix, end: postPrefix + '\xff'})
  .on('data', function (entry) {
    entries.push(entry);
  })
  .on('error', cb)
  .on('close', handler)
  .on('end', handler);
};

function threadFirstPost(threadId, cb) {
  // returned post
  var postId = "";

  // build the postIndexKey
  var postIndexKey = postPrefix + sep + threadId;

  // get the first post from the postIndex by threadId
  var postIndexOpts = {
    limit: 1,
    start: postIndexKey,
    end: postIndexKey + '\xff'
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

module.exports = posts;

