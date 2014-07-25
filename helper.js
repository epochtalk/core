var uuid = require('node-uuid');

module.exports = {
  makeHandler: function(entries, cb) {
    return function() {
      cb(null, entries.map(function(entry) {
        return entry.value;
      }));
    };
  },
  printPost: function(err, post) {
    // console.log(post);
    // logging?
  },
  genId: function(timestamp) {
    var id = timestamp + uuid.v1();
    return id;
  }
};
