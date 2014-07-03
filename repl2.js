var replify = require('replify');
var replpad = require('replpad');
var core = require(__dirname + '/index');
replify({
  name: 'epoch-core',
  path: __dirname + '/repl.sock',
  start: replpad
}, core);

