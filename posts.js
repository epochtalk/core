var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var config = require(__dirname + '/config');
var sep = config.sep;
var postPrefix = config.posts.prefix;
var threadPrefix = config.threads.prefix;

var posts = {};

printPost = function(err, post) {
  // console.log(post);
  // logging?
};

var makeHandler = function(entries, cb) {
  return function() {
    cb(null, entries.map(function(entry) {
      return entry.value;
    }));
  };
};

var validateBoard = function(post) {
  var valid = false;
  if (post.board_id) {
    valid = true;
  }
  return valid;
};

var validateThread = function(post) {
  var valid = false;
  if (post.thread_id) {
    valid = true;
  }
  return valid;
};

/* CREATE */
posts.create = function(post, cb) {
  if (cb === undefined) cb = printPost;
  if (!validateBoard(post)) {
    return cb(new Error('Post not valid'), post);
  }
  var timestamp = Date.now();
  var id = timestamp + uuid.v1();
  var threadId = post.thread_id;
  var boardId = post.board_id;
  post.threadStarter = false;

  // new thread
  if (!threadId) {
    // separate id for thread
    threadId = timestamp + uuid.v1();
    var threadKey = threadPrefix + sep + boardId + sep + threadId;
    var threadMeta = { id: threadId, title: post.title };
    post.threadStarter = true;

    db.put(threadKey, threadMeta, function(err, version) {
      // console.log('thread key: ' + threadKey);
    });
  }

  // configuring post
  post.thread_id = threadId;
  post.id = id;
  post.created_at = timestamp;

  var key = postPrefix + sep + threadId + sep + id;
  db.put(key, post, function(err, version) {
    // console.log('key: ' + key);
    post.version = version;
    return cb(err, post);
  });
};

/* RETRIEVE POST */
posts.find = function(threadId, id, cb) {
  if (cb === undefined) cb = printPost;
  var key = postPrefix + sep + threadId + sep + id;
  db.get(key, cb);
};

/* UPDATE */
posts.update = function(post, cb) {
  if (cb === undefined) cb = printPost;
  if (!validateBoard(post)) {
    return cb(new Error('Post not valid: No Board Id'), post);
  }
  if (!validateThread(post)) {
    return cb(new Error('Post not valid: No Thread Id'), post);
  }

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

        // update thread title?
        if (oldPost.threadStarter === true) {
          updateThreadTitle(oldBoardId, oldThreadId, oldPost.title, function(err, value) {
            if (err){ console.log(err); }
          });
        }
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
        if (post.threadStarter === true) {
          post.version = version;
          updateThreadTitle(post.board_id, post.thread_id, "DELTED: "+ post.title, function(err, value) {
            if (err) { console.log(err); }
          });
        }
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
  var handler = makeHandler(entries, cb);

  // query vars
  var searchKey = threadPrefix + sep + boardId;
  var queryOptions = {
    limit: Number(limit),
    reverse: true,
    start: searchKey,
    end: searchKey + '\xff'
  };
  
  // query
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
  var handler = makeHandler(entries, cb);

  // query vars
  var limit = opts.limit ? opts.limit : 10;
  var startThreadKey = postPrefix + sep + threadId + sep;
  var startPostKey = startThreadKey;
  if (opts.startPostId) startPostKey += opts.startPostId;
  var queryOptions = {
    limit: (limit + 1),
    reverse: true,
    start: startPostKey,
    end: startThreadKey + '\xff'
  };

  // query
  db.createReadStream(queryOptions)
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

module.exports = posts;


function updateThreadTitle(boardId, id, title, cb) {
  if (cb === undefined) { cb = null; }
  var key = threadPrefix + sep + boardId + sep + id;
  db.get(key, function(err, thread, version) {
    if (err) {
      return cb(new Error('Thread Not Found'), undefined);
    }
    else {
      thread.title = title;
      var opts = { version: version };
      db.put(key, thread, opts, cb);
    }
  });
}
