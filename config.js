module.exports = {
  dbPath: 'epoch.db',
  // sep: '\x00'
  sep: '~',
  boards: {
    prefix: 'board',
    categoryPrefix: 'category',
    indexPrefix: 'boards'
  },
  posts: {
    prefix: 'post',
    indexPrefix: 'posts',
    version: 'post_version'
  },
  threads: {
    prefix: 'thread',
    indexPrefix: 'threads'
  },
  users: {
    prefix: 'user',
    indexPrefix: 'users'
  }
};
