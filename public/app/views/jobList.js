var app = app || {};

(function($) {
  'use strict';

  app.JobListView = Backbone.View.extend({
    initialize: function() {
      this.$count = $('#job-count');

      this.listenTo(this.collection, 'add', this.render);
    },

    render: function() {
      if (this.collection.length) {
        this.$count.html(this.collection.length);
        this.$el.show();
      } else {
        this.$el.hide();
      }

      this.$el.html('');
      this.collection.each(function(job) {
        var view = new app.JobView({ model: job });
        view.render();
        this.$el.prepend(view.el);
      }, this);
    }

  });

})(jQuery);
