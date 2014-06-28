var levelup = require('levelup')
var db = levelup(__dirname + '/epochcore_db')
var epochcore = {};

// temporary
db.put('name', 'epochcore', function (err) {
  if (err) return console.log('Ooops!', err) // some kind of I/O error
  db.get('name', function (err, value) {
    if (err) return console.log('Ooops!', err) // likely the key was not found
    console.log('name=' + value)
  })
})

module.exports = epochcore;
