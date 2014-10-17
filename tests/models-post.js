var rimraf = require('rimraf');
var should = require('chai').should();
var path = require('path');
var dbName = '.testDB';
var core = require(path.join(__dirname, '..'))(dbName);
var probe = require(path.join(__dirname, '..', 'probe'))(core.engine);
var boards = core.boards;
var threads = core.threads;
var posts = core.posts;
var users = core.users;
var Post = require(path.join(__dirname, '..', 'posts', 'model'));
var config = require(path.join(__dirname, '..', 'config'));

describe('Post', function() {

  describe('#new', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user, thread;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create({ name: 'Board', description: 'Board Desc' });
      })
      .then(function(board) {
        return threads.create({ board_id: board.id });
      })
      .then(function(dbThread) {
        thread = dbThread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      });
    });

    it('should create a plain Post object', function() {
      var post = new Post(plainPost);
      post.should.be.a('object');
      post.id.should.equal(plainPost.id);
      post.title.should.equal(plainPost.title);
      post.body.should.equal(plainPost.body);
      post.created_at.should.be.a('number');
      post.updated_at.should.be.a('number');
      post.version.should.be.a('number');
      post.user_id.should.equal(user.id);
      post.thread_id.should.equal(thread.id)
      should.not.exist(post.imported_at);
      should.not.exist(post.deleted);
      should.not.exist(post.smf);
    });
  });

  describe('#ParseBody', function() {
    var plainPost = { title: 'post title', body: '[b]hello world.[/b]' };
    var user, thread;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create({ name: 'Board', description: 'Board Desc' });
      })
      .then(function(board) {
        return threads.create({ board_id: board.id });
      })
      .then(function(dbThread) {
        thread = dbThread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      });
    });

    it('should populate the encodedBody property', function() {
      plainPost.encodedBody.should.be.a('string');
    });
  });
  
  describe('#key', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user, thread;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create({ name: 'Board', description: 'Board Desc' });
      })
      .then(function(board) {
        return threads.create({ board_id: board.id });
      })
      .then(function(dbThread) {
        thread = dbThread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      });
    });

    it('should return the post\'s key', function() {
      var postPrefix = config.posts.prefix;
      var sep = config.sep;

      var post = new Post(plainPost);
      var key = post.key();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(postPrefix + sep + post.id);
    });
  });

  describe('#threadPostKey', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user, thread;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create({ name: 'Board', description: 'Board Desc' });
      })
      .then(function(board) {
        return threads.create({ board_id: board.id });
      })
      .then(function(dbThread) {
        thread = dbThread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      });
    });

    it('should return the post\'s thread post key', function() {
      var postPrefix = config.posts.indexPrefix;
      var sep = config.sep;

      var post = new Post(plainPost);
      var key = post.threadPostKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(postPrefix + sep + thread.id + sep + plainPost.id);
    });
  });

  describe('#legacyKey', function() {
    var plainPost = {
      title: 'post title',
      body: 'hello world.',
      smf: {
        ID_MSG: '9876543210'
      }
    };
    var user, thread;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create({ name: 'Board', description: 'Board Desc' });
      })
      .then(function(board) {
        return threads.create({ board_id: board.id });
      })
      .then(function(dbThread) {
        thread = dbThread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      });
    });

    it('should return the post\'s thread key', function() {
      var postPrefix = config.posts.prefix;
      var sep = config.sep;

      var post = new Post(plainPost);
      var key = post.legacyKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(postPrefix + sep + plainPost.smf.ID_MSG);
    });
  });

  describe('#threadKey', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user, thread;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create({ name: 'Board', description: 'Board Desc' });
      })
      .then(function(board) {
        return threads.create({ board_id: board.id });
      })
      .then(function(dbThread) {
        thread = dbThread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      });
    });

    it('should return the post\'s thread key', function() {
      var threadPrefix = config.threads.prefix;
      var sep = config.sep;

      var post = new Post(plainPost);
      var key = post.threadKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(threadPrefix + sep + thread.id);
    });
  });

  describe('#versionKey', function() {
    var plainPost = { title: 'post title', body: 'hello world.' };
    var user, thread;
    var newUser = {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'epochtalk',
      confirmation: 'epochtalk'
    };
    before(function() {
      return users.create(newUser)
      .then(function(dbUser) {
        user = dbUser;
        return boards.create({ name: 'Board', description: 'Board Desc' });
      })
      .then(function(board) {
        return threads.create({ board_id: board.id });
      })
      .then(function(dbThread) {
        thread = dbThread;
        plainPost.thread_id = thread.id;
        plainPost.user_id = user.id;
        return plainPost;
      })
      .then(posts.create)
      .then(function(post) {
        plainPost = post;
        return post;
      });
    });

    it('should return the post\'s thread key', function() {
      var postVerPrefix = config.posts.version;
      var sep = config.sep;

      var post = new Post(plainPost);
      var key = post.versionKey();

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(postVerPrefix + sep + plainPost.id + sep + plainPost.version);
    });
  });

  describe('#validate', function() {

    it('should validate the minimum post model', function() {
      var minPost = {
        title: 'Post Title',
        body: 'Post Body',
        user_id: '1A2B3C4D5E',
        thread_id: '0Z2B3C4D5E'
      };
      var post = new Post(minPost);
      var validPost = post.validateCreate().value();
      validPost.should.exist;
    });

    it('should validate that title is required', function() {
      var postObj = { };
      var post = new Post(postObj);
      return post.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('title is required');
      });
    });

    it('should validate that body is required', function() {
      var postObj = { title: 'Post Title' };
      var post = new Post(postObj);
      return post.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('body is required');
      });
    });

    it('should validate that user_id is required', function() {
      var postObj = { title: 'Post Title', body: 'Post Body' };
      var post = new Post(postObj);
      return post.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('user_id is required');
      });
    });

    it('should validate that thread_id is required', function() {
      var postObj = { title: 'Post Title', body: 'Post Body', user_id: '1234ABCD' };
      var post = new Post(postObj);
      return post.validateCreate()
      .then(function(data) {
        should.not.exist(data);
      })
      .catch(function(err) {
        err.should.exist;
        err.message.should.equal('thread_id is required');
      });
    });

    it('should validate dates are numbers', function() {
      var postObj = {
        title: 'A',
        body: 'B',
        user_id: 'C',
        thread_id: 'D',
        created_at: 12312312,
        updated_at: 13124121,
        imported_at: 12314124
      };
      var post = new Post(postObj);
      var validPost = post.validateCreate().value();
      validPost.should.exist;
    });

    it('should validate ids are string', function() {
      var postObj = {
        title: 'A',
        body: 'B',
        user_id: 'C',
        thread_id: 'D',
        id: 'E'
      };
      var post = new Post(postObj);
      var validPost = post.validateCreate().value();
      validPost.should.exist;
    });

    it('should validate deleted is a boolean', function() {
      var deletedPost = {
        title: 'A',
        body: 'B',
        user_id: 'C',
        thread_id: 'D',
        deleted: true
      };
      var post = new Post(deletedPost);
      var validPost = post.validateCreate().value();
      validPost.should.exist;
    });

    it('should validate version is a number', function() {
      var versionedPost = {
        title: 'A',
        body: 'B',
        user_id: 'C',
        thread_id: 'D',
        version: 12345
      };
      var post = new Post(versionedPost);
      var validPost = post.validateCreate().value();
      validPost.should.exist;
    });

    it('should validate that smf id\'s are numbers', function() {
      var smfPost = {
        title: 'A',
        body: 'B',
        user_id: 'C',
        thread_id: 'D',
        smf: {
          ID_MSG: 2342,
          ID_MEMBER: 123123,
          ID_TOPIC: 123123
        }
      };
      var post = new Post(smfPost);
      var validPost = post.validateCreate().value();
      validPost.should.exist;
    });
  });

  describe('#simple', function() {
    var fullPost = {
      id: 'Z',
      title: 'A',
      body: 'B',
      user_id: 'C',
      thread_id: 'D',
      created_at: 12312312,
      updated_at: 13124121,
      imported_at: 12314124,
      deleted: true,
      version: 12345612,
      smf: {
        ID_MEMBER: 123124,
        ID_TOPIC: 2141242,
        ID_MSG: 223242
      }
    };

    it('should return a simple version of the post', function() {
      var post = new Post(fullPost);
      var simplePost = post.simple();
      simplePost.id.should.equal(fullPost.id);
      simplePost.title.should.equal(fullPost.title);
      simplePost.body.should.equal(fullPost.body);
      simplePost.user_id.should.equal(fullPost.user_id);
      simplePost.thread_id.should.equal(fullPost.thread_id);
      simplePost.version.should.equal(fullPost.version);
      simplePost.created_at.should.equal(fullPost.created_at);
      simplePost.updated_at.should.equal(fullPost.updated_at);
      simplePost.imported_at.should.equal(fullPost.imported_at);
      simplePost.deleted.should.be.true;
      simplePost.smf.ID_TOPIC.should.equal(fullPost.smf.ID_TOPIC);
      simplePost.smf.ID_MSG.should.equal(fullPost.smf.ID_MSG);
      simplePost.smf.ID_MEMBER.should.equal(fullPost.smf.ID_MEMBER);

      should.not.exist(simplePost.key);
      should.not.exist(simplePost.threadPostKey);
      should.not.exist(simplePost.legacyKey);
      should.not.exist(simplePost.threadKey);
      should.not.exist(simplePost.versionKey);
      should.not.exist(simplePost.validate);
      should.not.exist(simplePost.simple);
      should.not.exist(simplePost.keyFromId);
      should.not.exist(simplePost.legacyKeyFromId);
      should.not.exist(simplePost.prefix);
    });
  });

  describe('#keyFromId', function() {
    it('should return the post\'s key', function() {
      var postPrefix = config.posts.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Post.keyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(postPrefix + sep + fakeId);
    });
  });

  describe('#legacyKeyFromId', function() {
    it('should return the post\'s legacy key', function() {
      var postPrefix = config.posts.prefix;
      var sep = config.sep;
      var fakeId = '123456789';

      var key = Post.legacyKeyFromId(fakeId);

      key.should.be.ok;
      key.should.be.a('string');
      key.should.be.equal(postPrefix + sep + fakeId);
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
