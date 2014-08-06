var path = require('path');
var core = {};
core.users = require(path.join(__dirname, 'users'));
core.boards = require(path.join(__dirname, 'boards'));
core.posts = require(path.join(__dirname, 'posts'));
core.threads = require(path.join(__dirname, 'threads'));

module.exports = core;
