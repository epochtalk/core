var boards = require(__dirname + '/../boards');

var boardCount = 100;
for (var i = 1; i <= 100; i++) {
  boards.create({
    name: 'Board ' + i,
    description: 'Hello World! This is a board' + i + ' in a popular forum.'
  }, function(err, board) {
    console.log(board);
  });
}

