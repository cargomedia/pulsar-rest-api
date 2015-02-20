var PulsarExec = require('../../lib/pulsar/exec');
var assert = require('chai').assert;
  var jobArgs = require('../data/job-args');

describe('Test constructor arguments of PulsarExec', function() {

  it('throw error if arguments are wrong', function() {
    assert.throw(function() {
      new PulsarExec()
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({app: ''})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({app: ' '})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({env: ''})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({env: ' '})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({app: jobArgs.app.example})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({env: jobArgs.env.production})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({app: ' ', env: ' '})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({app: jobArgs.app.example, env: jobArgs.env.production, pulsarOptions: ['no-dash']})
    }, ValidationError);
    assert.throw(function() {
      new PulsarExec({app: jobArgs.app.example, env: jobArgs.env.production, pulsarOptions: ['-c some-repo', '-b some-branch', 'no-dash']})
    }, ValidationError);
  });

  it('create arguments that will run spawn correctly', function() {
    var exec;

    exec = new PulsarExec({app: jobArgs.app.example, env: jobArgs.env.production, capistranoOptions: ['  -s hello', '-s "bye bye"']});
    assert.deepEqual(exec.getCommandArgs(), [jobArgs.app.example, jobArgs.env.production, '-s', 'hello', '-s', 'bye bye']);

    exec = new PulsarExec({app: jobArgs.app.example, env: jobArgs.env.production, pulsarOptions: ['--b ', '  --b "hi hi"  ']});
    assert.deepEqual(exec.getCommandArgs(), ['--b', '--b', 'hi hi', jobArgs.app.example, jobArgs.env.production]);

    exec = new PulsarExec({app: jobArgs.app.example, env: jobArgs.env.production, capistranoOptions: ['m bueno', 'none', 'm vista']});
    assert.deepEqual(exec.getCommandArgs(), [jobArgs.app.example, jobArgs.env.production, 'm', 'bueno', 'none', 'm', 'vista']);
  });

});
