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
		assert.equal(res.body.app, 'foo');
		assert.equal(res.body.env, 'bar');
		assert.equal(res.body.action, 'deploy');
		process.exit();
	});
