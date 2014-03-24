var app = app || {};

(function() {
  'use strict';

  app.TaskList = Backbone.Collection.extend({
    model: app.Task,
    url: '/tasks'
  });

})();
