var path = require('path');
var Charlatan = require('charlatan');
var async = require('async');
var seed = {};
var core = require(path.join(__dirname, '..'))();
var boardsCore = core.boards;
var threads = core.threads;
var posts = core.posts;
module.exports = seed;

//var numUsers = 25;
//var numMods = 10;
var numBoards = 15;
var maxPosts = 50;

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// var generateUser = function() {
//   var name = Charlatan.Internet.userName();
//   var email = Charlatan.Internet.freeEmail(name);
//   var createdDate = randomDate(new Date(2012, 0, 1), new Date());
//   var password = 'epochtalk';
//   var timestamps = {
//     created: createdDate.getTime(),
//     updated: Charlatan.Helpers.rand(10, 0) > 8 ? randomDate(createdDate, new Date()).getTime() : null
//   };
//   var user = {
//     username: name,
//     email: email,
//     password: password,
//     confirm_password: password,
//     timestamps: timestamps,
//     type: 'user'
//   };
//   return user;
// };

var generateBoard = function() {
  var words = Charlatan.Lorem.words(Charlatan.Helpers.rand(8, 1));
  words[0] = Charlatan.Helpers.capitalize(words[0]);
  var name = words.join(' ');
  var description = Charlatan.Lorem.paragraph(Charlatan.Helpers.rand(10, 3));
  // var createdDate = parentBoard ? randomDate(new Date(parentBoard.timestamps.created), new Date()) : randomDate(new Date(2012, 0, 1), new Date());
  var board = {
    name: name,
    description: description,
    // created_at: createdDate.getTime(),
  };
  return board;
};

var generatePost = function(authorId, previousPostTime, threadId, boardId) {
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
    body: body,
    // author_id: authorId,
    // created_at: createdDate.getTime(),
  };
  if (boardId) {
    post.board_id = boardId;
  }
  if (threadId) {
    post.thread_id = threadId;
  }
  return post;
};

// function seedUsers(seedUsersCallback) {
//   var users = [];
//   var i = 0;
//   async.whilst(
//     function() {
//       return i < numUsers;
//     },
//     function (cb) {
//       var user = generateUser();
//       db.users.register(user, function(err, body) {
//         user._id = body.id;
//         process.stdout.write('Generating Users: ' + user._id + '\r');
//         users.push(user);
//         i++;
//         cb(err);
//       });
//     },
//     function (err) {
//       if (err) {
//         console.log('Error generating users.');
//       }
//       seedUsersCallback(err, users);
//     }
//   );
// }

function seedBoards(users, parentBoard, seedBoardsCallback) {
  // var mods = users.slice(0, numMods);
  // var moderatorIds = [];
  // mods.forEach(function(mod){
  //   moderatorIds.push(mod._id);
  // });
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
      // var randModIds = Charlatan.Helpers.shuffle(moderatorIds);
      // var modsSubset = randModIds.slice(0, Charlatan.Helpers.rand(randModIds.length, 0));
      var board = generateBoard();
      if (parentBoard) {
        board.parent_id = parentBoard.id;
      }
      boardsCore.create(board)
      .then(function(createdBoard) {
        process.stdout.write('Generating Boards: ' + createdBoard.id + '\r');
        if (parentBoard) {
          boards.push(createdBoard);
          i++;
          cb();
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

function seedPosts(board, users, thread, seedPostsCallback) {
  var i = 0;
  var postCount = Charlatan.Helpers.rand(maxPosts, 1);
  async.whilst(
    function() { // generate 1 - maxPosts
      return i < postCount;
    },
    function (cb) {
      //var authorId = Charlatan.Helpers.sample(users)._id;
      var post;
      if (thread) { // sub level post
        post = generatePost(null, thread.created_at, thread.thread_id);
        posts.create(post)
        .then(function(createdPost) {
          process.stdout.write('Generating Post: ' + createdPost.id + '\r');
          if (thread) {
            i++;
            cb();
          }
          else {
            i++;
            seedPosts(null, users, createdPost, cb);
          }
        })
        .catch(function(err) {
          cb(err);
        });
      }
      else { // top level post
        post = generatePost(null, board.created_at, null, board.id);
        threads.create(post)
        .then(function(createdPost) {
          process.stdout.write('Generating Post: ' + createdPost.id + '\r');
          if (thread) {
            i++;
            cb();
          }
          else {
            i++;
            seedPosts(null, users, createdPost, cb);
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
      // function(cb) {
      //   console.log('Seeding users.');
      //   seedUsers(cb);
      // },
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