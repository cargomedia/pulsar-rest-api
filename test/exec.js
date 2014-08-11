var PulsarExec = require('../lib/pulsar/exec');
var assert = require('chai').assert;
var taskArgs = require('./task-args');

describe('Test constructor arguments of PulsarExec', function() {

  it('throw error if arguments are wrong', function() {
    assert.throw(function() {
      new PulsarExec()
    }, Error);
    assert.throw(function() {
      new PulsarExec({})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: ''})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: ' '})
    }, Error);
    assert.throw(function() {
      new PulsarExec({env: ''})
    }, Error);
    assert.throw(function() {
      new PulsarExec({env: ' '})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: taskArgs.app.example})
    }, Error);
    assert.throw(function() {
      new PulsarExec({env: taskArgs.env.production})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: ' ', env: ' '})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: taskArgs.app.example, env: taskArgs.env.production, pulsarOptions: ['no-dash']})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: taskArgs.app.example, env: taskArgs.env.production, pulsarOptions: ['-c some-repo', '-b some-branch', 'no-dash']})
    }, Error);
  });

  it('create arguments that will run spawn correctly', function() {
    var exec;

    exec = new PulsarExec({app: taskArgs.app.example, env: taskArgs.env.production, capistranoOptions: ['  -s hello', '-s "bye bye"']});
    assert.deepEqual(exec.getCommandArgs(), [taskArgs.app.example, taskArgs.env.production, '-s', 'hello', '-s', 'bye bye']);

    exec = new PulsarExec({app: taskArgs.app.example, env: taskArgs.env.production, pulsarOptions: ['--b ', '  --b "hi hi"  ']});
    assert.deepEqual(exec.getCommandArgs(), ['--b', '--b', 'hi hi', taskArgs.app.example, taskArgs.env.production]);

    exec = new PulsarExec({app: taskArgs.app.example, env: taskArgs.env.production, capistranoOptions: ['m bueno', 'none', 'm vista']});
    assert.deepEqual(exec.getCommandArgs(), [taskArgs.app.example, taskArgs.env.production, 'm', 'bueno', 'none', 'm', 'vista']);
  });

});
