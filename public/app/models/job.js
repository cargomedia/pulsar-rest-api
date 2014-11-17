var app = app || {};

(function() {
  'use strict';

  app.Job = Backbone.Model.extend({

    defaults: {
      status: null,
      stdout: null,
      stderr: null,
      completed: false
    },

    urlRoot: '/job'

  });
})();
