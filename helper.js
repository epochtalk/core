var uuid = require('node-uuid');
var path = require('path');

module.exports = {
  genId: function(timestamp) {
    timestamp = timestamp || Date.now();
    var id = timestamp + uuid.v1({ msecs: timestamp });
    return id;
  }
};
