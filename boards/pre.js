var boards = {};
module.exports = boards;

var path = require('path');
var sanitize = require(path.join('..', 'sanitize'));

boards.clean = function(board) {
  board.name = sanitize.strip(board.name);
  if (board.description) { board.description = sanitize.display(board.description); }
  return board;
};
