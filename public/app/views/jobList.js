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
      var view = new app.JobListItemView({model: job});
      view.render();
      this.$el.prepend(view.el);
    }
  });

})(jQuery);
