var vault = {};
module.exports = vault;

var Padlock = require('padlock').Padlock;
var safe = {};

vault.getLock = function(id) {
  var lock;

  if (safe[id]) { lock = safe[id]; }
  else {
    var idLock = new Padlock();
    safe[id] = idLock;
    lock = idLock;
  }

  return lock;
};