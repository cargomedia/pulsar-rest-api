var app = app || {};

(function($) {
  'use strict';

  app.JobListView = Backbone.View.extend({

    $count: null,
    $body: null,

    initialize: function() {
      this.$count = $('#job-count');
      this.$body = this.$el.find('tbody');
      this.listenTo(this.collection, 'add', this.addItem);
    },

    addItem: function(job) {
      this._renderJob(job);
    },

    render: function() {
      this.$count.html(this.collection.length);
      this.$body.html('');
      this.collection.each(function(job) {
        this._renderJob(job);
      }, this);

      this.$el.dataTable({
        order: [[2, 'desc']],
        columnDefs: [
          {"orderable": false, "targets": [0, 1]},
          {"bSearchable": false, "aTargets": [2]}
        ]
      });
      $(".timeago").timeago();
    },

    _renderJob: function(job) {
      var view = new app.JobListItemView({model: job});
      view.render();
      this.$body.append(view.el);
    }

  });

})(jQuery);
