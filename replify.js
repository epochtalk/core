var replify = require('replify');
var replpad = require('replpad');
var path = require('path');
var core = require(path.join(__dirname, 'index'));
replify({
  name: 'epoch-core',
  path: path.join(__dirname, 'repl.sock'),
  start: replpad
}, core);

