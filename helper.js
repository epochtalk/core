var uuid = require('node-uuid');
var path = require('path');
var config = require(path.join(__dirname, 'config'));
var postPrefix = config.posts.prefix;
var threadPrefix = config.threads.prefix;
var postIndexPrefix = config.posts.indexPrefix;
var threadIndexPrefix = config.threads.indexPrefix;
var sep = config.sep;

module.exports = {
  makeHandler: function(entries, cb) {
    return function() {
      cb(null, entries.map(function(entry) {
        return entry.value;
      }));
    };
  },
  printThread: function(err, thread) {
    if (err) { console.log(err); }
    if (thread) { console.log(thread); }
    // logging?
  },
  printPost: function(err, post) {
    if (err) { console.log(err); }
    if (post) { console.log(post); }
    // logging?
  },
  printBoard: function(err, board) {
    if (err) { console.error(err); }
    if (board) { console.log(board); }
    // logging?
  },
  genId: function(timestamp) {
    var id = timestamp + uuid.v1({ msecs: timestamp });
    return id;
  },
  associatedKeys: function(post) {
    // key array (return value)
    var associatedKeys = [];

    // thread index key 
    var threadId = post.thread_id;
    var threadPostKey = postIndexPrefix + sep + threadId + sep + post.id;
    associatedKeys.push({ key: threadPostKey });

    // post key
    var postKey = postPrefix + sep + post.id;
    associatedKeys.push({ key: postKey });

    // add board index key if available
    var boardId = post.board_id;
    if (boardId) {
      var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
      associatedKeys.push({ key: boardThreadKey });
      var threadKey = threadPrefix + sep + threadId;
      associatedKeys.push({ key: threadKey });
    }

    // smf sublevel post key
    if (post.smf && post.smf.post_id) {
      var smfPostKey = postPrefix + sep + post.smf.post_id.toString();
      associatedKeys.push({ key: smfPostKey, smf: true });
    }

    // smf sublevel thread key
    if (post.smf && post.smf.thread_id) {
      var smfThreadKey = threadPrefix + sep + post.smf.thread_id.toString();
      associatedKeys.push({ key: smfThreadKey, smf: true });
    }

    return associatedKeys;
  }
};
