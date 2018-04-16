var baseJob = require("./Job.js"),
  request = require("requestretry"),
  util = require('util'),
  logger = require("./Logger.js");

/*
 * examples of jobDefinition:
 * 
 * Post every 2 minutes
 * {
 *  "name": "postjob",
 *  "request": {
 *      "method": "POST",
 *      "uri": "http://localhost:8088/data",
 *      "body":{'data':'somedata'},
 *      "json":true
 *  },
 *  "recur":{
 *      "triggers":["0/2 * * * * ?"]
 *  }
 * }
 * */
var RestJob;
module.exports = RestJob = function (jobDefinition) {
  baseJob.call(this, jobDefinition);
  this.request = jobDefinition.request;
};
util.inherits(RestJob, baseJob);


RestJob.prototype.execute = function () {
  var defaultHandler = function (err, response, body) {
    if (err)
      return logger.error('[RestJob] request failed: %s', err);
    else
      logger.info('[RestJob] Request successful!  Server responded with: %s', body);
  };

  logger.info( `[RestJob] requesting ${this.request.method} ${this.request.uri}` );
  request(this.request, defaultHandler);
};
