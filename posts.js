var uuid = require('node-uuid');
var db = require(__dirname + '/db');
var posts = {};
var modelPrefix = 'post\x00';

printPost = function(err, post) {
  console.log(post);
};

posts.create = function(post, cb) {
  if (cb === undefined) cb = printPost;
  var id = uuid.v4();
  var key = modelPrefix + id;
  post.id = id;
  db.put(key, post, function(err) {
    return cb(err, post);
  });
};

posts.find = function(id, cb) {
  db.get(modelPrefix + id, cb);
};

posts.all = function(cb) {
  var entries = []
  db.createReadStream({ start: modelPrefix, end: modelPrefix + '\xff'})
    .on('data', function (entry) { entries.push(entry) })
    .on('close', function () { cb(null, entries) })
}

module.exports = posts;

