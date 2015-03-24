var app = app || {};

(function($) {
  'use strict';

  app.JobAbstractView = Backbone.View.extend({

    getStatusColor: function(status) {
      var statusLabel;
      switch (status) {
        case 'CREATED':
          statusLabel = 'info';
          break;
        case 'FINISHED':
          statusLabel = 'success';
          break;
        case 'RUNNING':
          statusLabel = 'primary';
          break;
        case 'KILLED':
        case 'FAILED':
          statusLabel = 'danger';
          break;
        default:
          statusLabel = 'warning';
          break;
      }
      return statusLabel;
    }

  });

})(jQuery);
