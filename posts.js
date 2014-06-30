var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var posts = {};
var postPrefix = 'post\x00';

posts.create = function(post, cb) {
  var id = uuid.v4();
  var key = postPrefix + id;
  post.id = id;
  db.put(key, post, cb);
};

posts.find = function(id, cb) {
  db.get(postPrefix + id, cb);
};

posts.all = function(cb) {
  var entries = []
  db.createReadStream({ start: postPrefix, end: postPrefix + '\xff', limit: 100})
    .on('data', function (entry) { entries.push(entry) })
    .on('close', function () { cb(null, entries) })
}

module.exports = posts;

