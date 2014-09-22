var bytewise = require('bytewise');

module.exports = {
  encodeIntHex: function(value) {
    return bytewise.encode(value).toString('hex');
  }
};

