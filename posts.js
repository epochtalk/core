var db = require(__dirname + '/db');
var posts = {};

posts.create = function(post, cb) {
  db.put(post.id, post, cb);
};

posts.find = function(id, cb) {
  db.get(id, cb);
};

module.exports = posts;

