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

posts.create = function(post, cb) {
  if (cb === undefined) cb = printPost;
  var timestamp = Date.now();
  var id = timestamp + uuid.v4();
  var threadId = post.thread_id;

  // new thread
  if (!threadId) {
    // separate id for thread
    threadId = timestamp + uuid.v4();
    var threadKey = threadPrefix + sep + threadId;
    var threadMeta = { id: threadId, post_count: 1 };

    db.put(threadKey, threadMeta, function(err, version) {
      console.log('thread key: ' + threadKey);
    });
  }

  // configuring post
  post.thread_id = threadId;
  post.id = id;
  post.created_at = timestamp;

  var key = postPrefix + sep + threadId + sep + id;
  db.put(key, post, function(err, version) {
    console.log('key: ' + key);
    post.version = version;
    return cb(err, post);
  });
};

posts.find = function(id, cb) {
  if (cb === undefined) cb = printPost;
  db.get(modelPrefix + id, cb);
};

posts.starters = function(cb) {
  var entries = []
  db.createReadStream({ start: threadPrefix, end: threadPrefix + '\xff'})
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
  var entries = []

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

