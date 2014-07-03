var repl = require('repl');
var users = require(__dirname + '/users');
var boards = require(__dirname + '/boards');
var posts = require(__dirname + '/posts');

var replServer = repl.start({
  prompt: 'ept-core > ',
});

replServer.context.users = users;
replServer.context.boards = boards;
replServer.context.posts = posts;
