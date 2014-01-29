var request = require('supertest')
	Server = require('../lib/server'),
	assert = require('assert');

api = new Server();
request(api.getInstance())
	.post('/foo/bar')
	.send({ action: "deploy"})
	.expect(200, function(err, res) {
		if(err) {
			throw err;
		}

		assert.ok(typeof(res.body.taskId) !== undefined, "Task id created");
		process.exit();
	});
