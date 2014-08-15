var path = require('path');
var dbName = 'test-epoch.db';
var core = require(path.join(__dirname, '..'))(dbName);

describe('posts', function() {
  describe('#create', function() {
    it('should create a post object and insert into db.', function() {
      var p = {
        body: 'hello world. testing 1234',
      }
      core.posts.create(p);
    });
  });
});

