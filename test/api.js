var request = require('supertest')
Server = require('../lib/server'),
  assert = require('assert');

var jobId;

//api = new Server();
//request(api.getInstance())
//	.post('/foo/bar')
//	.send({ task: "deploy"})
//	.expect(200, function(err, res) {
//		if(err) {
//			throw err;
//		}
//
//		assert.ok(typeof(res.body.jobId) !== undefined, "Job id created");
//		jobId = res.body.jobId;
//
//		process.exit();
//	});
