var repl = require('repl');
var local = repl.start('epoch> ');
local.context.boards = require('./boards');
local.context.threads = require('./threads');
local.context.posts = require('./posts');
local.context.users = require('./users');
