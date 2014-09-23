var app = app || {};

(function() {
  'use strict';

  app.JobList = Backbone.Collection.extend({
    model: app.Job,
    url: '/jobs'
  });

})();
