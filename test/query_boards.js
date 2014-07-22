var boards = require(__dirname + '/../boards');
boards.all(function(err, results) {
  results.forEach(function(board) {
    console.log(board);
  });
});

