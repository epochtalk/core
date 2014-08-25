var path = require('path');
var Charlatan = require('charlatan');
var async = require('async');
var seed = {};
var core = require(path.join(__dirname, '..'))();
var boardsCore = core.boards;
var threads = core.threads;
var posts = core.posts;
module.exports = seed;

var numBoards = 15;
var maxPosts = 50;

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

var generateBoard = function() {
  var words = Charlatan.Lorem.words(Charlatan.Helpers.rand(8, 1));
  words[0] = Charlatan.Helpers.capitalize(words[0]);
  var name = words.join(' ');
  var description = Charlatan.Lorem.paragraph(Charlatan.Helpers.rand(10, 3));
  var board = {
    name: name,
    description: description
  };
  return board;
};

var generatePost = function(authorId, previousPostTime, threadId) {
  var words = Charlatan.Lorem.words(Charlatan.Helpers.rand(8, 1));
  words[0] = Charlatan.Helpers.capitalize(words[0]);
  var title = words.join(' ');
  var paragraphCount = Charlatan.Helpers.rand(10, 1);
  var body = Charlatan.Lorem.text(paragraphCount, false, '<br /><br />');
  var createdDate;
  if (previousPostTime) { // generate next post within 1 week of previous
    var oldDate = new Date(previousPostTime);
    var futureDate = new Date(Number(previousPostTime) + 1000 * 60 * 60 * 24 * 7);
    createdDate = randomDate(oldDate, futureDate);
  }
  else { // if this is a top leel post just generate a random date.
    createdDate = randomDate(new Date(2012, 0, 1), new Date());
  }
  var post = {
    title: title,
    body: body
  };
  post.thread_id = threadId;
  return post;
};

function seedBoards(users, parentBoard, seedBoardsCallback) {
  if (parentBoard) {
    var subBoardCount = Charlatan.Helpers.rand(6, 0);
    var randNum = Charlatan.Helpers.rand(10, 0);
    subBoardCount = randNum > 6 ? subBoardCount : 0;
  }
  var boards = [];
  var i = 0;
  async.whilst(
    function() {
      var loopCount = parentBoard ? subBoardCount : numBoards;
      return i < loopCount;
    },
    function (cb) {
      var board = generateBoard();
      if (parentBoard) {
        board.parent_id = parentBoard.id;
      }
      boardsCore.create(board)
      .then(function(createdBoard) {
        process.stdout.write('Generating Boards: ' + createdBoard.id + '\r');
        if (parentBoard) {
          boards.push(createdBoard);
          if (!parentBoard.children_ids) {
            parentBoard.children_ids = [];
          }
          parentBoard.children_ids.push(createdBoard.id);
          boardsCore.update(parentBoard)
          .then(function() {
            i++;
            cb();
          })
          .catch(function(err) {
            cb(err);
          });
        }
        else {
          seedBoards(users, createdBoard, function (err, subBoards) {
            createdBoard.subBoards = subBoards; // add subBoards for top level Boards
            boards.push(createdBoard);
            i++;
            cb(err);
          });
        }
      })
      .catch(function(err) {
        cb(err);
      });
    },
    function (err) {
      if (err) {
        console.log('Error generating boards.');
      }
      seedBoardsCallback(err, boards, users);
    }
  );
}

function seedPosts(board, users, threadId, seedPostsCallback) {
  var i = 0;
  var postCount = Charlatan.Helpers.rand(maxPosts, 1);
  async.whilst(
    function() { // generate 1 - maxPosts
      return i < postCount;
    },
    function (cb) {
      var post;
      if (threadId) { // sub level post
        post = generatePost(null, null, threadId);
        posts.create(post)
        .then(function(createdPost) {
          process.stdout.write('Generating Post: ' + createdPost.id + '\r');
          if (threadId) {
            i++;
            cb();
          }
          else {
            i++;
            seedPosts(null, users, threadId, cb);
          }
        })
        .catch(function(err) {
          cb(err);
        });
      }
      else { // top level post
        var plainThread = { board_id: board.id };
        threads.create(plainThread)
        .then(function(newThread) {
          plainThread = newThread;
          post = generatePost(null, null, plainThread.id);
          return post;
        })
        .then(posts.create)
        .then(function(createdPost) {
          process.stdout.write('Generating Post: ' + createdPost.id + '\r');
          if (plainThread.id) {
            i++;
            cb();
          }
          else {
            i++;
            seedPosts(null, users, plainThread.id, cb);
          }
        })
        .catch(function(err) {
          cb(err);
        });
      }
    },
    function (err) {
      if (err) {
        console.log('Error generating posts.');
      }
      seedPostsCallback(err);
    }
  );
}

function seedTopLevelPosts(boards, users, seedTopLevelPostsCallback) {
  var i = 0;
  async.whilst(
    function() {
      return i < boards.length;
    },
    function (cb) {
      var board = boards[i];
      seedPosts(board, users, null, function(err) { // generate x top level posts per board
        if (board.subBoards && board.subBoards.length > 0) {
          i++;
          seedTopLevelPosts(board.subBoards, users, cb);
        }
        else {
          i++;
          cb(err);
        }
      });
    },
    function (err) {
      if (err) {
        console.log('Error generating posts.');
      }
      seedTopLevelPostsCallback(err);
    }
  );
}

seed.seed = function() {
  async.waterfall([
      function(cb) {
        console.log('\nSeeding boards.');
        seedBoards(null, null, cb);
      },
      function(boards, users, cb) {
        console.log('\nSeeding posts.');
        seedTopLevelPosts(boards, users, cb);
      }
    ],
    function (err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log('\nDatabase seed complete.');
      }
    }
  );
};
seed.seed();
