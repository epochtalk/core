var path = require('path');
var threadIndexes = require(path.join(__dirname, 'threads', 'indexes'));
var postIndexes = require(path.join(__dirname, 'posts', 'indexes'));
module.exports = [].concat(threadIndexes, postIndexes);
