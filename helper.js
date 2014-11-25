var Promise = require('bluebird');
var uuid = require('node-uuid');
var path = require('path');
var tree = require(path.join(__dirname, 'db')).tree;

module.exports = {
  genId: function(timestamp) {
    timestamp = timestamp || Date.now();
    var id = timestamp + uuid.v1({ msecs: timestamp });
    return id;
  },
  decMetadata: function(storedModel) {
    return new Promise(function(fulfill, reject) {
      var model = storedModel.value;
      tree.metadata({
        key: storedModel.key,
        callback: function(err, metadata) {
          if (err) { reject(err); }
          Object.keys(metadata).forEach(function(key) {
            model[key] = metadata[key];
          });
          model.id = storedModel.key[1];
          fulfill(model);
        }
      });
    });
  }
};
