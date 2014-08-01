var path = require('path');
var levelup = require('levelup');
var core = {};
core.users = require(path.join(__dirname, 'users'));
core.boards = require(path.join(__dirname, 'boards', 'boards'));
core.posts = require(path.join(__dirname, 'posts'));

module.exports = core;
