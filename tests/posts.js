var should = require('chai').should();
var rimraf = require('rimraf');
var path = require('path');
var dbName = '.testDB';
var core = require(path.join(__dirname, '..'))(dbName);
var probe = require(path.join(__dirname, '..', 'probe'));
var posts = core.posts;
var threads = core.threads;
var boards = core.boards;
var helper = require(path.join(__dirname, 'helper'));

describe('posts', function() {

  describe('#byThread', function() {
    var post1 = { title: 'title', body: 'body' };
    var post2 = { title: 'title', body: 'body' };
    var parentThead, user;

    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        parentThread = thread;
        post1.thread_id = thread.id;
        post1.user_id = user.id;
        post2.thread_id = thread.id;
        post2.user_id = user.id;
      })
      .then(function() {
        return posts.create(post1)
        .then(function(post){
          post1 = post;
        });
      })
      .then(function() {
        return posts.create(post2)
        .then(function(post) {
          post2 = post;
        });
      });
    });

    it('should return posts for a threadId', function() {
      return posts.byThread(parentThread.id, { limit: 10 })
      .then(function(allPosts) {
        allPosts.forEach(function(post) {
          post.id.should.be.ok;
          post.id.should.be.a('string');
          post.created_at.should.be.a('number');
          post.updated_at.should.be.a('number');
          should.not.exist(post.imported_at);
          post.title.should.equal('title');
          post.body.should.equal('body');
          post.user.should.exist;
          post.user.id.should.equal(user.id);
          post.user.username.should.be.a('string');
          should.not.exist(post.deleted);
          should.not.exist(post.smf);
          post.thread_id.should.equal(parentThread.id);
          post.version.should.be.a('number');
        });
      });
    });

    it('should return 2 posts', function() {
      return posts.byThread(parentThread.id, { limit: 10 })
      .then(function(allPosts) {
        allPosts.should.have.length(2);
      });
    });
  });

  describe('#versions', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      })
      .then(function(post) {
        post.title = 'updated';

        post.encodedBody = 'updated';
        return posts.update(post);
      });
    });

    it('should verify all versions of a post', function() {
      return posts.versions(plainPost.id)
      .then(function(postVersions) {
        postVersions.forEach(function(post) {
          post.id.should.be.ok;
          post.id.should.be.a('string');
          post.created_at.should.be.a('number');
          post.updated_at.should.be.a('number');
          should.not.exist(post.imported_at);
          post.title.should.be.a('string');
          post.body.should.be.a('string');
          post.user_id.should.equal(user.id);
          should.not.exist(post.deleted);
          should.not.exist(post.smf);
          post.thread_id.should.equal(plainPost.thread_id);
          post.version.should.be.a('number');
        });
      });
    });

    it('should return 2 posts', function() {
      return posts.versions(plainPost.id)
      .then(function(postVersions) {
        postVersions.should.have.length(2);
      });
    });
  });

  describe('#create', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
      });
    });

    it('should create a post in the db', function() {
      return posts.create(plainPost)
      .then(function(post) {
        post.id.should.be.ok;
        post.id.should.be.a('string');
        post.created_at.should.be.a('number');
        post.updated_at.should.be.a('number');
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.version.should.be.a('number');
        post.thread_id.should.equal(plainPost.thread_id);
      });
    });
  });

  describe('#import', function() {
    var plainPost = {
      title: 'post title',
      body: 'hello world.',
      smf: {
        ID_MSG: 123
      }
     };
     var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(core.threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
      });
    });

    it('should create a post in the db', function() {
      return posts.import(plainPost)
      .then(function(post) {
        post.id.should.be.ok;
        post.id.should.be.a('string');
        post.created_at.should.be.a('number');
        post.updated_at.should.be.a('number');
        post.imported_at.should.be.a('number');
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        post.smf.ID_MSG.should.equal(plainPost.smf.ID_MSG);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
      });
    });
  });

  describe('#import_get', function() {
    var plainPost = {
      title: 'post title',
      body: 'hello world.',
      smf: {
        ID_MSG: 123
      }
    };
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(core.threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.import(plainPost);
      })
      .then(function(post) {
        plainPost = post;
      });
    });

    it('should verify key mapping for imported posts', function() {
      return posts.postByOldId(plainPost.smf.ID_MSG)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.equal(plainPost.updated_at);
        post.imported_at.should.equal(plainPost.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        should.not.exist(post.deleted);
        post.smf.ID_MSG.should.equal(plainPost.smf.ID_MSG);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.equal(plainPost.version);
      });
    });
  });

  describe('#import_purge', function() {
    var catchCalled = false;
    var user;
    var plainPost = {
      title: 'post title',
      body: 'hello world.',
      smf: {
        ID_MSG: 123
      }
     };

    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(core.threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return posts.import(plainPost);
      })
      .then(function(post) {
        plainPost = post;
      });
    });

    it('should delete all imported thread key mappings', function() {
      return posts.purge(plainPost.id)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.equal(plainPost.updated_at);
        post.imported_at.should.equal(plainPost.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        post.smf.ID_MSG.should.equal(plainPost.smf.ID_MSG);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.equal(plainPost.version);
        return post.smf.ID_MSG;
      })
      .then(posts.postByOldId)
      .catch(function(err) {
        catchCalled = true;
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
      })
      .then(function() {
        catchCalled.should.be.true;
      });
    });
  });

  describe('#find', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
      });
    });

    it('should find a post from the db', function() {
      return posts.find(plainPost.id)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.equal(plainPost.updated_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.equal(plainPost.version);
      });
    });
  });

  describe('#update', function() {
    var plainPost = { title: 'post title', encodedBody: 'hello world.' };
    var createdPost, updatedPost;
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        createdPost = post;
        return posts.find(post.id);
      })
      .then(function(postToUpdate) {
        postToUpdate.title = 'update name';
        postToUpdate.encodedBody = 'update Description';
        postToUpdate.farfigneuton = 'g is 7th';
        return postToUpdate;
      })
      .then(posts.update)
      .then(function(post){
        updatedPost = post;
      });
    });

<<<<<<< HEAD
    it('should update specified post with new values', function() {
      plainPost.title = 'update name';
      plainPost.body = 'update Description';

      return posts.update(plainPost)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.be.above(plainPost.created_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
        // post.version.should.not.equal(plainPost.version);
      });
=======
    it('should have the same id', function() {
      createdPost.id.should.equal(updatedPost.id);
>>>>>>> tests/posts update now uses helper
    });

    it('should have updated specified post with new values', function() {
      return posts.find(createdPost.id)
      .then(function(post) {
        post.id.should.equal(createdPost.id);
        post.created_at.should.equal(createdPost.created_at);
        post.updated_at.should.be.above(createdPost.created_at);
        should.not.exist(post.imported_at);
<<<<<<< HEAD
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
=======
        post.title.should.not.equal(createdPost.title);
        post.body.should.not.equal(createdPost.encodedBody);
        post.title.should.equal(updatedPost.title);
        post.body.should.equal(updatedPost.body);
        post.user_id.should.equal(user.id);
>>>>>>> tests/posts update now uses helper
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(createdPost.thread_id);
        post.version.should.be.a('number');
        post.version.should.not.equal(createdPost.version);
      });
    });
  });

  describe('#delete', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
      });
    });

    it('should delete a post from the db', function() {
      return posts.delete(plainPost.id)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.be.above(plainPost.created_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.user_id.should.equal(user.id);
        post.deleted.should.be.true;
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
        post.version.should.not.equal(plainPost.version);
        return posts.find(post.id);
      })
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.be.above(plainPost.created_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.deleted.should.be.true;
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
        post.version.should.not.equal(plainPost.version);
      });
    });
  });

  describe('#undelete', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        return helper.delay(post.id, posts.delete, 1000)
        .then(function(post) { plainPost = post; });
      });
    });

    it('should undelete specified post', function() {
      return posts.undelete(plainPost.id)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.be.above(plainPost.created_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
        // post.version.should.not.equal(plainPost.version);
        return post.id;
      })
      .then(function(postid) {
        return helper.delay(postid, posts.find, 1000);
      })
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.be.above(plainPost.created_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
        // post.version.should.not.equal(plainPost.version);
      });
    });
  });

  describe('#purge', function() {
    var catchCalled = false;
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user;
    before(function() {
      var newUser = {
        username: 'test_user',
        email: 'test_user@example.com',
        password: 'epochtalk',
        confirmation: 'epochtalk'
      };
      return core.users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        var newBoard = { name: 'Board', description: 'Board Desc' };
        return boards.create(newBoard);
      })
      .then(function(board) {
        return { board_id: board.id };
      })
      .then(threads.create)
      .then(function(thread) {
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
      });
    });

    it('should purge the specified post', function() {
      return posts.purge(plainPost.id)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.equal(plainPost.updated_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.body);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.equal(plainPost.version);
        return post.id;
      })
      .then(posts.find)
      .catch(function(err) {
        catchCalled = true;
        err.should.not.be.null;
        err.type.should.equal('NotFoundError');
      })
      .then(function() {
        catchCalled.should.be.true;
      });
    });
  });
  
  describe('#CLEANING', function() {
    it('cleaning all db', function() {
      return probe.clean();
    });
  });

  after(function(done) {
    rimraf(path.join(__dirname, '..', dbName), done);
  });
});

