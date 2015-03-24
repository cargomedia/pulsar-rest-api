var app = app || {};

(function($) {
  'use strict';

  app.JobListItemView = app.JobAbstractView.extend({

    template: _.template($('#job-list-item-template').html()),

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      var job = this.model;
      job.set('statusColor', this.getStatusColor(job.get('status')));
      this.$el.html(this.template(job.toJSON()));
      this.$el.find('.timeago').timeago();
    }

  });

})(jQuery);
