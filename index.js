var levelup = require('levelup');
var core = {};
core.users = require(__dirname + '/users');
core.boards = require(__dirname + '/boards');
core.posts = require(__dirname + '/posts');

module.exports = core;
