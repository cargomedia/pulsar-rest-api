var app = app || {};

(function() {
  'use strict';

  app.JobList = Backbone.Collection.extend({
    model: app.Job,
    url: '/jobs',
    comparator: function(job) {
      return job.get('timestamp');
    }
  });

})();
