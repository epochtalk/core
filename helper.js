var uuid = require('node-uuid');
var config = require(__dirname + '/config');


module.exports = {
  makeHandler: function(entries, cb) {
    return function() {
      cb(null, entries.map(function(entry) {
        return entry.value;
      }));
    };
  },
  printPost: function(err, post) {
    console.log(post);
    // logging?
  },
  genId: function(timestamp) {
    var id = timestamp + uuid.v1();
    return id;
  },
  associatedKeys: function(post) {
    var boardId = post.board_id;
    var threadId = post.thread_id;
    var postIndexPrefix = config.posts.indexPrefix;
    var postPrefix = config.posts.prefix;
    var threadIndexPrefix = config.threads.indexPrefix;
    var sep = config.sep;
    var boardThreadKey = threadIndexPrefix + sep + boardId + sep + threadId;
    var threadPostKey = postIndexPrefix + sep + threadId + sep + post.id;
    return [postPrefix + sep + post.id, boardThreadKey, threadPostKey];
  }
};
