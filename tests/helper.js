var Promise = require('bluebird');
var helper = module.exports = {};

helper.delay = function(input, worker, delay) {
  return new Promise(function(fulfill, reject) {
    setTimeout(function(){
      fulfill(worker(input));
    }, delay);
  });
};
