var PulsarExec = require('../lib/pulsar/exec');
var assert = require('chai').assert;

var STUB_APP = 'example';
var STUB_ENV = 'production';

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
      new PulsarExec({app: STUB_APP})
    }, Error);
    assert.throw(function() {
      new PulsarExec({env: STUB_ENV})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: ' ', env: ' '})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: STUB_APP, env: STUB_ENV, pulsarOptions: ['no-dash']})
    }, Error);
    assert.throw(function() {
      new PulsarExec({app: STUB_APP, env: STUB_ENV, pulsarOptions: ['-c some-repo', '-b some-branch', 'no-dash']})
    }, Error);
  });

  it('create arguments that will run spawn correctly', function() {
    var exec;

    exec = new PulsarExec({app: STUB_APP, env: STUB_ENV, capistranoOptions: ['  -s hello', '-s "bye bye"']});
    assert.deepEqual(exec.getCommandArgs(), [STUB_APP, STUB_ENV, '-s', 'hello', '-s', 'bye bye']);

    exec = new PulsarExec({app: STUB_APP, env: STUB_ENV, pulsarOptions: ['--b ', '  --b "hi hi"  ']});
    assert.deepEqual(exec.getCommandArgs(), ['--b', '--b', 'hi hi', STUB_APP, STUB_ENV]);

    exec = new PulsarExec({app: STUB_APP, env: STUB_ENV, capistranoOptions: ['m bueno', 'none', 'm vista']});
    assert.deepEqual(exec.getCommandArgs(), [STUB_APP, STUB_ENV, 'm', 'bueno', 'none', 'm', 'vista']);
  });

});
