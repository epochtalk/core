module.exports = [
  { type: 'post', parentType: 'thread', field: 'created_at' },
  { type: 'post', agnostic: true, field: 'smf.ID_MSG' },
  { type: 'postVersion', parentType: 'post', field: 'updated_at' }
];
