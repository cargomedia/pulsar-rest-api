var app = app || {};

(function($) {
  'use strict';

  app.JobListView = Backbone.View.extend({

    $count: null,

    initialize: function() {
      this.$count = $('#job-count');
      this.listenTo(this.collection, 'add', this.addItem);
    },

    addItem: function(job) {
      this._renderJob(job);
    },

    render: function() {
      this.$count.html(this.collection.length);
      this.$el.html('');
      this.collection.each(function(job) {
        this._renderJob(job);
      }, this);

      $(".timeago").timeago();
    },

    _renderJob: function(job) {
      job.set('statusColor', this.getStatusColor(job.get('status')));
      var view = new app.JobListItemView({model: job});
      view.render();
      this.$el.prepend(view.el);
    },

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
