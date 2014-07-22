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
  }
}

var validatePost = function(post) {
  var valid = false;
  if (post.board_id) {
    valid = true;
  }
  return valid;
}

posts.create = function(post, cb) {
  if (cb === undefined) cb = printPost;
  if (!validatePost) {
    return cb(new Error('Post not valid'), post);
  }
  var timestamp = Date.now();
  var id = timestamp + uuid.v1();
  var threadId = post.thread_id;
  var boardId = post.board_id;

  // new thread
  if (!threadId) {
    // separate id for thread
    threadId = timestamp + uuid.v1();
    var threadKey = threadPrefix + sep + boardId + sep + threadId;
    var threadMeta = { id: threadId };

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

posts.find = function(id, cb) {
  if (cb === undefined) cb = printPost;
  db.get(modelPrefix + id, cb);
};

posts.threads = function(boardId, limit, cb) {
  var entries = [];
  var handler = makeHandler(entries, cb);
  var searchKey = threadPrefix + sep + boardId;
  db.createReadStream({limit: Number(limit), reverse: true, start: searchKey, end: searchKey + '\xff'})
  .on('data', function (entry) {
    entries.push(entry);
  })
  .on('close', handler)
  .on('end', handler);
}

posts.forThread = function(threadId, opts, cb) {
  var entries = [];
  var startThreadKey = postPrefix + sep + threadId + sep;
  var limit = opts.limit ? opts.limit : 10;
  var startPostKey = startThreadKey;
  if (opts.startPostId) startPostKey += opts.startPostId;

  console.log(startPostKey);
  db.createReadStream({ limit: (limit + 1), reverse: true, start: startPostKey, end: startThreadKey + '\xff'})
  .on('data', function (entry) {
    entries.push(entry);
  })
  .on('end', function () {
    cb(null, entries.map(function(entry) {
      return entry.value;
    }));
  });
}

posts.all = function(cb) {
  var entries = [];

  db.createReadStream({ start: postPrefix, end: postPrefix + '\xff'})
  .on('data', function (entry) {
    entries.push(entry);
  })
  .on('end', function () {
    cb(null, entries.map(function(entry) {
      return entry.value;
    }));
  });
};

module.exports = posts;

