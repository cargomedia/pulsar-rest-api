require('../lib/errors');
var PulsarJob = require('../lib/pulsar/job');
var PulsarDb = require('../lib/pulsar/db');
var Config = require('../lib/config');

var _ = require('underscore');
var fs = require('fs');
var async = require('async');

var testConfig = new Config('./test/data/configs/config.yaml').asHash();
require('../lib/logger').configure(testConfig);

new PulsarDb(testConfig.mongodb, function(err, db) {
  if (err) {
    throw err;
  }

  var jobDataList = JSON.parse(fs.readFileSync('./test/data/jobListFixture.json', {encoding: 'utf-8'}));
  var jobList = _.map(jobDataList, function(jobData) {
    return new PulsarJob(null, jobData);
  });
  async.each(jobList, function(job, callback) {
    db.saveJob(job, callback)
  }, function(err) {
    if (err) {
      throw err;
    }
    console.log(jobList.length + ' items of job list successfully loaded to ' + testConfig.mongodb.db + ' database');
    process.exit(0);
  });

/*
  //export
  db.getJobList(function(err, jobList) {
    var jobDataList = _.map(jobList, function(job) {
      return job.getData()
    });
    fs.writeFile('./test/data/jobListFixture.json', JSON.stringify(jobDataList), function(err) {
      if (err) {
        throw err;
      }
      console.log(jobList.length + ' items of job list successfully saved from ' + testConfig.mongodb.db + ' database');
      process.exit(0);
    });
  })
*/
});
