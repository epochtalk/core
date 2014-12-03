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
    var post1 = { title: 'title', encodedBody: 'body' };
    var post2 = { title: 'title', encodedBody: 'body' };
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
      .then(core.threads.create)
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
    var plainPost = { title: 'post title', encodedBody: 'hello world.' };
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
    var plainPost = { title: 'post title', encodedBody: 'hello world.' };
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
        post.body.should.equal(plainPost.encodedBody);
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
      encodedBody: 'hello world.',
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
        post.body.should.equal(plainPost.encodedBody);
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
      encodedBody: 'hello world.',
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
      encodedBody: 'hello world.',
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
    var plainPost = { title: 'post title', encodedBody: 'hello world.' };
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

    it('should update specified post with new values', function() {
      plainPost.title = 'update name';
      plainPost.encodedBody = 'update Description';

      return posts.update(plainPost)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.be.above(plainPost.created_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.encodedBody);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
        // post.version.should.not.equal(plainPost.version);
      });
    });

    it('should return the updated post on find', function() {
      return posts.find(plainPost.id)
      .then(function(post) {
        post.id.should.equal(plainPost.id);
        post.created_at.should.equal(plainPost.created_at);
        post.updated_at.should.be.above(plainPost.created_at);
        should.not.exist(post.imported_at);
        post.title.should.equal(plainPost.title);
        post.body.should.equal(plainPost.encodedBody);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.thread_id.should.equal(plainPost.thread_id);
        post.version.should.be.a('number');
        // post.version.should.not.equal(plainPost.version);
      });
    });
  });

  describe('#delete', function() {
    var plainPost = { title: 'post title', encodedBody: 'hello world.' };
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
        return post.id;
      })
      .then(posts.find)
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
    var plainPost = { title: 'post title', encodedBody: 'hello world.' };
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
        return posts.delete(post.id)
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
      .then(posts.find)
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
    var plainPost = { title: 'post title', encodedBody: 'hello world.' };
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

  describe('#SANITIZE', function() {
    var safeTitle = 'post title';
    var unsafeTitle = 'post title<script>alert("okay");</script>';
    var safeBody = '<div>Test</div> Post <b>Description</b><img /><img src="http://placehold.it/400/400" />';
    var unsafeBody = '<div class="test">Test</div> Post <b>Description</b><script>alert("something");</script><IMG SRC="javascript:alert("XSS");"><img src="http://placehold.it/400/400" />';
    var plainPost = { title: unsafeTitle, encodedBody: unsafeBody };
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
        post.title.should.equal(safeTitle);
        post.body.should.equal(safeBody);
        post.user_id.should.equal(user.id);
        should.not.exist(post.deleted);
        should.not.exist(post.smf);
        post.version.should.be.a('number');
        post.thread_id.should.equal(plainPost.thread_id);
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

