module.exports = function(server, authorization) {

  server.post('/:app/:env', authorization.restrictTo('write'));

  server.get('/job/:id', authorization.restrictTo('read'));

  server.post('/job/:id/kill', authorization.restrictTo('write'));

  server.get('/jobs', authorization.restrictTo('read'));

  server.get('/:app/:env/tasks', authorization.restrictTo('read'));

};
